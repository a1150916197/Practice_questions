module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // 在生产环境中关闭一些不影响功能的警告
    '@typescript-eslint/no-unused-vars': process.env.NODE_ENV === 'production' ? 'off' : 'warn',
    'react-hooks/exhaustive-deps': process.env.NODE_ENV === 'production' ? 'off' : 'warn',
    'import/first': 'error',
    '@typescript-eslint/no-redeclare': 'error',
  }
}; 