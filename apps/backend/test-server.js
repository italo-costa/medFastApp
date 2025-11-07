console.log('Testando Node.js...');
console.log('Diretório atual:', process.cwd());
console.log('Versão Node:', process.version);

try {
    console.log('Testando importação do app...');
    require('./src/app.js');
} catch (error) {
    console.error('Erro ao importar app:', error.message);
    console.error('Stack:', error.stack);
}