import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,               // imports explícitos de vitest — mais legível nos arquivos de teste
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    clearMocks: true,             // limpa call history entre testes automaticamente
    restoreMocks: true,           // restaura implementações originais após cada teste
  },
  resolve: {
    // permite que imports com .js (padrão dos arquivos TS do projeto) sejam
    // resolvidos para os arquivos .ts correspondentes durante os testes
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
});
