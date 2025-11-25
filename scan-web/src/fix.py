import io

with io.open('BoardEditor.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix the flipBoard function
output = []
i = 0
while i < len(lines):
    if 'function flipBoard()' in lines[i]:
        # Add the function declaration
        output.append(lines[i])
        i += 1
        # Add the setFlipped line
        if i < len(lines) and 'setFlipped' in lines[i]:
            output.append(lines[i])
            i += 1
        # Skip the setCoordinatesFlipped line
        if i < len(lines) and 'setCoordinatesFlipped' in lines[i]:
            i += 1
        # Add the closing brace
        if i < len(lines) and '}' in lines[i]:
            output.append(lines[i])
            i += 1
    else:
        output.append(lines[i])
        i += 1

with io.open('BoardEditor.jsx', 'w', encoding='utf-8') as f:
    f.writelines(output)

print('Fixed flipBoard')
