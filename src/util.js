export function getCurrentWordBounds(input) {
    const text = input.value;
    const end = input.selectionStart;
    let start = end;

    let currentChar = text.charAt(start - 1);

    while (currentChar && currentChar !== ' ' && start > 0) {
        start--;
        currentChar = text.charAt(start - 1);
    }

    return {start, end};
}

export function getCurrentWord(input) {
    const bounds = getCurrentWordBounds(input);

    return input.value.substring(bounds.start, bounds.end);
}