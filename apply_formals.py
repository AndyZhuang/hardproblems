"""Apply strengthened formal fields to gen_problems.py."""
import re
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('deploy/gen_problems.py', encoding='utf-8') as f:
    content = f.read()

with open('strengthen_formals.json', encoding='utf-8') as f:
    strengthens = json.load(f)

# 替换每个 problem 的 formal 字段
# 用正则匹配 id='xxx', ... formal='...', 块
# 简单方法：逐个 add() 块替换

# 切分 add() 块
blocks = re.split(r'(?=\nadd\()', content)
print(f'Blocks: {len(blocks)}')

new_blocks = []
applied = 0
for b in blocks:
    m_id = re.search(r"id='([^']+)'", b)
    if m_id and m_id.group(1) in strengthens:
        pid = m_id.group(1)
        new_formal = strengthens[pid]
        # 替换这个块里的 formal='...'
        new_b = re.sub(
            r"formal='[^']*'",
            f"formal={new_formal!r}",  # !r repr
            b,
            count=1
        )
        new_blocks.append(new_b)
        applied += 1
    else:
        new_blocks.append(b)

print(f'Applied: {applied} / {len(strengthens)}')

new_content = ''.join(new_blocks)

# 验证 Python 语法
try:
    compile(new_content, 'deploy/gen_problems.py', 'exec')
    print('SYNTAX_OK')
except SyntaxError as e:
    print(f'SYNTAX_ERR: {e}')
    sys.exit(1)

# 写回
with open('deploy/gen_problems.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Written deploy/gen_problems.py')
