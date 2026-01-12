module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: ['react-app', 'eslint:recommended'],
    rules: {
        'no-unused-vars': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    },
};
