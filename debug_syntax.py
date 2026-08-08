import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8')

# Test various ways to do multi-line participate
tests = {
    'no comma eol': '''add(
    id='test',
    participate=part(('solve', 'test')
                  ('code', 'test'))
    summaryEn='English',
)
''',
    'comma eol': '''add(
    id='test',
    participate=part(('solve', 'test'),
                  ('code', 'test'))
    summaryEn='English',
)
''',
    'comma+nl after each': '''add(
    id='test',
    participate=part(
        ('solve', 'test'),
        ('code', 'test'))
    summaryEn='English',
)
''',
    'comma before paren close': '''add(
    id='test',
    participate=part(('solve', 'test'),
                  ('code', 'test'),),
    summaryEn='English',
)
''',
    'backslash': '''add(
    id='test',
    participate=part(('solve', 'test'), \\
                  ('code', 'test'))
    summaryEn='English',
)
''',
}

for name, code in tests.items():
    try:
        compile(code, 'test', 'exec')
        print(f'{name}: OK')
    except SyntaxError as e:
        print(f'{name}: line {e.lineno} offset {e.offset} - {e.msg}')
