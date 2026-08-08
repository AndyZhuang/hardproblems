"""Apply English translations to top problems in gen_problems.py.
Fix: add a comma after the closing '))' of part() so the next field is a kwarg of add().
"""

import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

TRANSLATIONS = {
    'millennium-riemann': {
        'summaryEn': 'Does the distribution of prime numbers have a perfect mathematical explanation?',
        'kidEn': "Imagine you have infinitely many jars of candy, each jar holding a different number of candies. The 'prime' jars are special: 2, 3, 5, 7, 11... they can only be split evenly by 1 and themselves. Mathematicians believe these jars follow a hidden pattern. The Riemann Hypothesis is about writing that hidden pattern as a clean math formula. Get it right and the Clay Foundation gives you $1 million!",
        'formalEn': 'All non-trivial zeros of the Riemann zeta function ζ(s) lie on the critical line Re(s) = 1/2 in the complex plane.',
        'whyHardEn': "It is entangled with almost every important conjecture in number theory; in 165 years no one has proven it, and no one has produced a counterexample.",
        'aiPromptEn': "You are a friendly math teacher. Explain the Riemann Hypothesis to a 12-year-old, then give a rigorous statement, current research state, key approaches, and key references."
    },
    'millennium-pvsnp': {
        'summaryEn': 'Can every problem whose solution can be quickly verified also be quickly solved?',
        'kidEn': 'Some puzzles are easy to check answers for but hard to solve. For example, a Sudoku: once you see a solution, you can quickly verify it is correct, but finding it took effort. P vs NP asks: does this always happen, or is there a faster way?',
        'formalEn': 'Does P (problems solvable in polynomial time) equal NP (problems whose solutions are verifiable in polynomial time)?',
        'whyHardEn': "It is the central question in theoretical computer science. Resolving it would unlock (or prove impossible) thousands of algorithms in optimization, cryptography, AI, and biology.",
        'aiPromptEn': 'Explain P vs NP to a 12-year-old. Cover: what each class means, why it matters, the main approaches (relativization, natural proofs, algebrization), and the most recent breakthrough attempts.'
    },
    'millennium-yangmills': {
        'summaryEn': 'Why can we describe the strong force with math, but cannot rigorously prove it exists?',
        'kidEn': "There are 4 fundamental forces: gravity, electricity, weak force, and strong force. The strong force is what holds the nucleus together. We have a beautiful theory for it (Yang-Mills) that works perfectly, but nobody has been able to mathematically prove that the theory actually has the right answers. Strange!",
        'formalEn': 'Prove that for any compact simple gauge group G, a non-trivial Yang-Mills theory on R⁴ exists and has a mass gap Δ > 0.',
        'whyHardEn': 'It requires bridging the gap between physics intuition (which works) and rigorous mathematics (which has not yet been built). Related to the four-dimensional Yang-Mills existence and mass gap problem.',
        'aiPromptEn': 'Explain the Yang-Mills existence and mass gap to a 12-year-old. Cover: what is gauge theory, why mass gap matters, the Hodge structure analogy, and what progress has been made.'
    },
    'millennium-navierstokes': {
        'summaryEn': 'Can we prove that fluid flow never spontaneously goes haywire?',
        'kidEn': "When you turn on a faucet, water flows smoothly. When you turn it up more, it gets turbulent. The Navier-Stokes equations describe this fluid flow. We use them to design planes, predict weather, and model oceans. But mathematically, we have not proven that the equations always have nice solutions and never 'explode' to infinity.",
        'formalEn': 'Prove that smooth, globally defined solutions exist for the Navier-Stokes equations in R³ for all time, given smooth initial conditions.',
        'whyHardEn': 'It involves subtle questions about energy conservation and the regularity of fluid solutions, and the $1M prize has eluded mathematicians for 25+ years.',
        'aiPromptEn': 'Explain the Navier-Stokes regularity problem to a 12-year-old. Cover: what the equations are, why turbulence is hard, current approaches (energy methods, blow-up candidates), and implications for weather/climate modeling.'
    },
    'millennium-hodge': {
        'summaryEn': 'Are all geometric shapes decomposable into simpler building blocks?',
        'kidEn': "Imagine you have a beautiful donut (torus). Can you always cut it into smaller pieces that are 'algebraic shapes'? The Hodge conjecture says yes, but no one has proven it for all shapes.",
        'formalEn': "On a smooth complex projective variety, every Hodge class is a rational linear combination of the cohomology classes of complex algebraic subvarieties.",
        'whyHardEn': 'It bridges algebraic geometry, topology, and complex analysis. The statement is elegant, but the proof requires entirely new techniques that have not yet been developed.',
        'aiPromptEn': 'Explain the Hodge conjecture to a 12-year-old. Use the torus/donut analogy. Cover: algebraic cycles, cohomology, why this matters for math unification.'
    },
    'millennium-bsd': {
        'summaryEn': 'How many rational points does an elliptic curve have?',
        'kidEn': "An elliptic curve is a special donut shape with a beautiful structure. The Birch and Swinnerton-Dyer conjecture predicts exactly how many 'rational points' (points with integer coordinates) it has. The rank determines this count, but proving the conjecture is incredibly hard.",
        'formalEn': 'For an elliptic curve E over Q, the rank of the Mordell-Weil group E(Q) equals the order of vanishing of the L-function L(E, s) at s = 1.',
        'whyHardEn': 'It connects number theory to analysis and modular forms. Partial progress by Gross-Zagier and Kolyvag shows it is true at least sometimes, but the general case remains open.',
        'aiPromptEn': 'Explain the BSD conjecture to a 12-year-old. Use the rational point analogy. Cover: L-functions, ranks, what we know from the Gross-Zagier theorem, and the 2021 lakhshme work.'
    },
    'twin-primes': {
        'summaryEn': 'Are there infinitely many pairs of prime numbers that differ by 2?',
        'kidEn': "Twin primes are pairs of primes that differ by 2, like (3,5), (5,7), (11,13), (17,19). Are there infinitely many such pairs? Most mathematicians think yes, but no one has proven it yet.",
        'formalEn': 'Are there infinitely many pairs of primes (p, p+2)?',
        'whyHardEn': "It is a special case of the prime tuples conjecture. The 2013 Zhang theorem and Maynard's later work showed the gap between consecutive primes is bounded — a huge breakthrough — but proving infinitely many gaps of exactly 2 is still open.",
        'aiPromptEn': 'Explain twin primes to a 12-year-old. Cover: what they are, the Zhang/Maynard bounded gaps breakthrough, and the Hardy-Littlewood prime tuples conjecture.'
    },
    'goldbach': {
        'summaryEn': 'Can every even number greater than 2 be written as the sum of two primes?',
        'kidEn': "Take any even number: 4 = 2+2, 6 = 3+3, 8 = 3+5, 10 = 5+5, 10 = 3+7. Can every even number be written as the sum of two primes? Goldbach said yes in 1742, but no one has proven it.",
        'formalEn': 'For every even integer n > 2, there exist primes p and q such that n = p + q.',
        'whyHardEn': 'It is an exceptionally simple statement to write down but has resisted all attempts at proof for 280+ years. The weak Goldbach conjecture (every odd number > 5 is sum of 3 primes) was proven by Helfgott in 2013.',
        'aiPromptEn': 'Explain the Goldbach conjecture to a 12-year-old. Cover: how to verify it for small numbers, why it is hard, the weak Goldbach proof by Helfgott, and what computational verification tells us.'
    },
    'collatz': {
        'summaryEn': "Does Collatz's sequence always reach 1?",
        'kidEn': "Take any number. If it's even, divide by 2. If it's odd, multiply by 3 and add 1. Keep going. Does it always reach 1? Tested up to 10²⁰ and yes, but no proof.",
        'formalEn': 'For the function f(n) = n/2 if n is even, 3n+1 if n is odd, does iteration of f starting from any positive integer n eventually reach 1?',
        'whyHardEn': 'It is one of the simplest-to-state yet hardest-to-prove problems in mathematics. The dynamics is chaotic, and partial results (e.g., Tao 2019) show most orbits converge, but the general case is still wide open.',
        'aiPromptEn': 'Explain the Collatz conjecture to a 12-year-old. Cover: the rules, the stopping time distribution, why it is hard (chaos, irregular behavior), and recent partial results.'
    },
    'fermat-catalan': {
        'summaryEn': "Are there any solutions to xᵃ + yᵇ = zᶜ with 1/a + 1/b + 1/c < 1 beyond the known ones?",
        'kidEn': "Fermat's Last Theorem says no solutions to x³ + y³ = z³. But what about 2³ + 3² = 1 + 9 = 17, but 17 is not a perfect cube. The Catalan conjecture (now Mihailescu theorem) says 2³ + 1³ = 3² is the only such solution.",
        'formalEn': "Are there any other solutions to xᵃ + yᵇ = zᶜ with x, y, z, a, b, c > 0 and 1/a + 1/b + 1/c < 1 besides 2³ + 1³ = 3²?",
        'whyHardEn': "It is a generalization of Fermat's Last Theorem. Mihailescu proved the special case 1/a + 1/b + 1/c = 1 (the Catalan/Mihailescu theorem), but the general inequality case is still open.",
        'aiPromptEn': 'Explain the Fermat-Catalan conjecture to a 12-year-old. Cover: Fermat last theorem, the Catalan special case, and what 1/a + 1/b + 1/c < 1 means.'
    },
}

src_path = 'deploy/gen_problems.py'
content = open(src_path, encoding='utf-8').read()

parts = re.split(r'(?=\nadd\()', content)
print(f'Total parts: {len(parts)}')

new_parts = []
applied = 0
for part in parts:
    m_id = re.search(r"id='([^']+)'", part)
    if m_id and m_id.group(1) in TRANSLATIONS:
        pid = m_id.group(1)
        trans = TRANSLATIONS[pid]

        # 找到 participate=part(...)) 这一行的位置
        # 用 regex 找 participat 关键字，扩展到下一个 )) 后面
        match = re.search(r"participate=part\([\s\S]*?\)\)\n", part)
        if not match:
            new_parts.append(part)
            continue

        # 把 part 调用的最后 )) 后面加 , （在 \n 之前）
        new_part = part[:match.end() - 1] + ',' + part[match.end() - 1:]

        # 找到 add() 块的 closing ) 位置
        # 现在 block 看起来:
        #   participate=part(...)),
        #   summaryEn=...,
        #   ...
        # )  <-- add 关闭
        # 找最后一行只有一个 ')'
        lines = new_part.split('\n')
        close_line_idx = None
        for i in range(len(lines) - 1, -1, -1):
            if lines[i].strip() == ')':
                close_line_idx = i
                break

        if close_line_idx is None:
            new_parts.append(part)
            continue

        # 构造英文字段
        insert_lines = []
        for key in ['summaryEn', 'kidEn', 'formalEn', 'whyHardEn', 'aiPromptEn']:
            if key in trans:
                insert_lines.append(f'    {key}={trans[key]!r},')

        new_lines = lines[:close_line_idx] + insert_lines + lines[close_line_idx:]
        new_part = '\n'.join(new_lines)
        new_parts.append(new_part)
        applied += 1
        print(f'  ✓ {pid}')
    else:
        new_parts.append(part)

new_content = ''.join(new_parts)

# 验证
try:
    compile(new_content, src_path, 'exec')
    print('SYNTAX_OK')
except SyntaxError as e:
    print(f'SYNTAX_ERR: line {e.lineno}: {e.msg}')
    with open('_archive/debug_gen_problems.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    sys.exit(1)

open(src_path, 'w', encoding='utf-8').write(new_content)
print(f'\nApplied {applied} translations to {src_path}')
