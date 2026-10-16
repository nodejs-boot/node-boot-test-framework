const {ESLint} = require("eslint");

// ESLint 8 reports ignored files (dotfiles, .eslintignore entries) as warnings,
// which --max-warnings=0 turns into failures. Only lint files ESLint would actually lint.
const lintableFiles = async files => {
    const eslint = new ESLint();
    const ignored = await Promise.all(files.map(file => eslint.isPathIgnored(file)));
    return files.filter((_, i) => !ignored[i]);
};

module.exports = {
    "*": "prettier --write --ignore-unknown",
    "*.{js,ts}": async files => {
        const lintable = await lintableFiles(files);
        return lintable.length ? [`eslint --fix --max-warnings=0 ${lintable.map(f => `"${f}"`).join(" ")}`] : [];
    },
};
