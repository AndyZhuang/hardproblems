#!/usr/bin/env python3
"""Translation helper for problems data.

Uses local LLM (via local-runtime.auth.json access token) to translate
Chinese problem fields to English. Batches problems to minimize API calls.

Usage:
  python translate_problems.py --source deploy/gen_problems.py --out deploy/gen_problems_en.py
"""

import json
import re
import sys
import time
from pathlib import Path
import argparse

# 读取 access token
AUTH_FILE = Path.home() / '.minimax' / 'local-runtime.auth.json'
CFG_FILE = Path.home() / '.minimax' / 'config.yaml'

def get_access_token():
    if not AUTH_FILE.exists():
        raise FileNotFoundError(f'auth file not found: {AUTH_FILE}')
    return json.loads(AUTH_FILE.read_text())['auth']['accessToken']

def get_config():
    import yaml
    return yaml.safe_load(CFG_FILE.read_text())

def translate_batch(texts, lang='en', model='MiniMax-M3'):
    """Translate a batch of Chinese strings to target lang using LLM."""
    import httpx
    token = get_access_token()
    cfg = get_config()
    provider_cfg = cfg['provider']['minimax']
    base_url = provider_cfg['options']['baseURL']

    # 构造批处理 prompt
    system = f'You are a professional translator. Translate the following Chinese texts to {({"en": "English", "es": "Spanish", "ja": "Japanese"})[lang]}. Preserve all technical terms, mathematical notation, and proper nouns. Return only a JSON array of strings, one per input, in the same order. No commentary.'

    # 转义引号
    items = '\n'.join(f'{i+1}. {repr(t)}' for i, t in enumerate(texts))

    user = f'Translate these {len(texts)} texts:\n{items}\n\nReturn a JSON array of {len(texts)} strings, same order.'

    payload = {
        'model': model,
        'max_tokens': 8000,
        'temperature': 0.3,
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': user}
        ]
    }

    # OpenAI-compatible endpoint
    url = f'{base_url.rstrip("/")}/chat/completions'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    r = httpx.post(url, json=payload, headers=headers, timeout=180)
    if r.status_code != 200:
        raise RuntimeError(f'LLM call failed: {r.status_code} {r.text[:300]}')
    data = r.json()
    text = data['choices'][0]['message']['content']
    # 提取 JSON
    match = re.search(r'\[[\s\S]*\]', text)
    if not match:
        raise RuntimeError(f'No JSON in response: {text[:300]}')
    return json.loads(match.group(0))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='deploy/gen_problems.py', help='Input gen_problems.py path')
    parser.add_argument('--out', default='data/translate_en.json', help='Output JSON for translations')
    parser.add_argument('--lang', default='en', help='Target language')
    parser.add_argument('--batch', type=int, default=20, help='Batch size')
    args = parser.parse_args()

    # 解析 gen_problems.py
    src = Path(args.input).read_text(encoding='utf-8')
    # 提取每个 add() 块
    blocks = re.split(r'(?=\nadd\()', src)
    print(f'Found {len(blocks)-1} add() blocks')

    # 提取每个问题的 (kid, formal, whyHard, aiPrompt)
    items = []
    for b in blocks[1:]:
        m_id = re.search(r"id='([^']+)'", b)
        if not m_id: continue
        pid = m_id.group(1)
        m_kid = re.search(r"kid='([^']*)'", b)
        m_formal = re.search(r"formal='([^']*)'", b)
        m_why = re.search(r"whyHard='([^']*)'", b)
        m_ai = re.search(r"aiPrompt='([^']*)'", b)
        m_summary = re.search(r"summary='([^']*)'", b)
        items.append({
            'id': pid,
            'kid': m_kid.group(1) if m_kid else '',
            'formal': m_formal.group(1) if m_formal else '',
            'whyHard': m_why.group(1) if m_why else '',
            'aiPrompt': m_ai.group(1) if m_ai else '',
            'summary': m_summary.group(1) if m_summary else '',
        })

    print(f'Extracted {len(items)} problems')

    # 读取已有翻译（增量）
    out_path = Path(args.out)
    if out_path.exists():
        existing = json.loads(out_path.read_text(encoding='utf-8'))
    else:
        existing = {}

    # 找出需要翻译的
    to_translate = []
    for item in items:
        if item['id'] in existing:
            continue
        to_translate.append(item)

    print(f'Need to translate: {len(to_translate)} problems')

    if not to_translate:
        print('All done!')
        return

    # 批处理翻译
    BATCH = args.batch
    FIELDS = ['summary', 'kid', 'formal', 'whyHard', 'aiPrompt']

    for batch_start in range(0, len(to_translate), BATCH):
        batch = to_translate[batch_start:batch_start + BATCH]
        print(f'\n=== Batch {batch_start // BATCH + 1}/{(len(to_translate) + BATCH - 1) // BATCH} ({len(batch)} problems) ===')

        # 把所有字段 flatten 成一个大列表
        flat = []
        for item in batch:
            for f in FIELDS:
                flat.append(item.get(f, ''))

        # 调用 LLM
        try:
            translated = translate_batch(flat, lang=args.lang)
        except Exception as e:
            print(f'LLM failed: {e}')
            print('Saving progress and exiting...')
            break

        # 验证长度
        if len(translated) != len(flat):
            print(f'WARN: got {len(translated)} translations, expected {len(flat)}')

        # 重组回每个 problem
        idx = 0
        for item in batch:
            pid = item['id']
            existing[pid] = existing.get(pid, {'id': pid})
            for f in FIELDS:
                if idx < len(translated):
                    key = f + (args.lang == 'en' and 'En' or args.lang.capitalize())
                    existing[pid][key] = translated[idx]
                idx += 1
            print(f'  ✓ {pid}: summary={existing[pid].get("summaryEn", "")[:50]}...')

        # 增量保存
        out_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'  Saved {len(existing)} total')

        # 限速：避免触发 rate limit
        time.sleep(2)

    print(f'\nDone! Output: {out_path}')

if __name__ == '__main__':
    main()
