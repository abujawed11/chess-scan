import io

with io.open('BoardEditor.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the coordinate display logic
# Find all {sq[0] === 'a' && ( and replace with {(coordinatesFlipped ? sq[0] === 'h' : sq[0] === 'a') && (
content = content.replace('{sq[0] === \\'a\\' && (', '{(coordinatesFlipped ? sq[0] === \\'h\\' : sq[0] === \\'a\\') && (')

# Find all {sq[1] === '1' && ( and replace with {(coordinatesFlipped ? sq[1] === '8' : sq[1] === '1') && (
content = content.replace('{sq[1] === \\'1\\' && (', '{(coordinatesFlipped ? sq[1] === \\'8\\' : sq[1] === \\'1\\') && (')

with io.open('BoardEditor.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed coordinate display')
