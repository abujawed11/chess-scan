import io

# First, let's just look at the flipBoard function
with io.open('BoardEditor.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('function flipBoard')
end = content.find('}', start) + 1
print('Current flipBoard function:')
print(repr(content[start:end]))
