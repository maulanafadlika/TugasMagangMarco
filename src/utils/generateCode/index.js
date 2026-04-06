const slugify = require('slugify');
const logger = require('../logger');

let lastIndex = {};

exports.generateCode = (phrase) => {
    if (typeof phrase !== 'string' || !phrase.trim()) {
        throw new Error('Invalid input: phrase must be a non-empty string');
    }

    logger.info(`cek phrase data : ${JSON.stringify(phrase)}`);

    // Split by spaces and filter out empty strings
    const words = phrase.split(' ').filter(word => word.length > 0);
    
    // If no words remain, throw an error
    if (words.length === 0) {
        throw new Error('No valid words found in the phrase');
    }

    let code = '';
    
    // Generate code from each word
    for (let word of words) {
        // Find first alphanumeric character in the word
        for (let char of word) {
            if (/[a-zA-Z0-9]/.test(char)) {
                code += char.toUpperCase();
                break;
            }
        }
        
        // If we have 4 characters, stop
        if (code.length >= 4) {
            break;
        }
    }
    
    // If we still don't have enough characters, try to get more from existing words
    if (code.length < 4) {
        let wordIndex = 0;
        let charIndex = 1; // Start from second character
        
        while (code.length < 4 && wordIndex < words.length) {
            const word = words[wordIndex];
            const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
            
            if (cleanWord.length > charIndex) {
                code += cleanWord[charIndex].toUpperCase();
            }
            
            wordIndex++;
            // If we've gone through all words, try next character position
            if (wordIndex >= words.length) {
                wordIndex = 0;
                charIndex++;
            }
        }
    }
    
    // Ensure we have at least 1 character
    if (code.length === 0) {
        throw new Error('No valid alphanumeric characters found in the phrase');
    }
    
    // Limit to 4 characters
    code = code.substring(0, 4);

    if (!lastIndex[code]) {
        lastIndex[code] = 1;
    } else {
        lastIndex[code]++;
    }

    const paddedIndex = String(lastIndex[code]).padStart(2, '0');

    return `${code}_${paddedIndex}`;
};