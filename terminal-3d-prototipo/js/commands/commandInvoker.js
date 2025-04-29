/**
 * CommandInvoker - Gerenciador central do padrão Command
 * 
 * Responsável por registrar, executar e gerenciar o histórico de comandos,
 * permitindo operações como desfazer/refazer.
 */

const CommandInvoker = (function() {
    // Histórico de comandos executados
    const _commandHistory = [];
    // Índice atual no histórico (para desfazer/refazer)
    let _currentIndex = -1;
    // Limite do histórico para evitar consumo excessivo de memória
    const _historyLimit = 50;
    // Flag para habilitar/desabilitar o histórico
    let _historyEnabled = true;

    /**
     * Executa um comando
     * @param {Object} command - Comando a ser executado (deve ter método execute())
     * @param {boolean} addToHistory - Se o comando deve ser adicionado ao histórico
     * @returns {*} - O resultado da execução do comando
     */
    function executeCommand(command, addToHistory = true) {
        if (!command || typeof command.execute !== 'function') {
            console.error("Comando inválido: não possui método execute()");
            return null;
        }

        try {
            // Executar o comando
            const result = command.execute();
            
            // Adicionar ao histórico se necessário
            if (addToHistory && _historyEnabled && typeof command.undo === 'function') {
                // Se estamos no meio do histórico, remover comandos futuros
                if (_currentIndex < _commandHistory.length - 1) {
                    _commandHistory.splice(_currentIndex + 1);
                }
                
                // Adicionar o novo comando ao histórico
                _commandHistory.push(command);
                _currentIndex = _commandHistory.length - 1;
                
                // Limitar o tamanho do histórico
                if (_commandHistory.length > _historyLimit) {
                    _commandHistory.shift();
                    _currentIndex--;
                }
            }
            
            return result;
        } catch (error) {
            console.error("Erro ao executar comando:", error);
            return null;
        }
    }

    /**
     * Desfaz o último comando executado
     * @returns {boolean} - true se o comando foi desfeito com sucesso
     */
    function undo() {
        if (_currentIndex < 0 || _commandHistory.length === 0) {
            console.log("Não há comandos para desfazer");
            return false;
        }

        const command = _commandHistory[_currentIndex];
        if (typeof command.undo !== 'function') {
            console.error("Comando não suporta operação de desfazer");
            return false;
        }

        try {
            command.undo();
            _currentIndex--;
            return true;
        } catch (error) {
            console.error("Erro ao desfazer comando:", error);
            return false;
        }
    }

    /**
     * Refaz o último comando desfeito
     * @returns {boolean} - true se o comando foi refeito com sucesso
     */
    function redo() {
        if (_currentIndex >= _commandHistory.length - 1) {
            console.log("Não há comandos para refazer");
            return false;
        }

        const command = _commandHistory[_currentIndex + 1];
        if (typeof command.execute !== 'function') {
            console.error("Comando não suporta operação de refazer");
            return false;
        }

        try {
            command.execute();
            _currentIndex++;
            return true;
        } catch (error) {
            console.error("Erro ao refazer comando:", error);
            return false;
        }
    }

    /**
     * Limpa o histórico de comandos
     */
    function clearHistory() {
        _commandHistory.length = 0;
        _currentIndex = -1;
    }

    /**
     * Habilita ou desabilita o histórico de comandos
     * @param {boolean} enabled - Se o histórico deve estar habilitado
     */
    function setHistoryEnabled(enabled) {
        _historyEnabled = !!enabled;
        if (!_historyEnabled) {
            clearHistory();
        }
    }

    /**
     * Obtém informações sobre o estado atual do histórico
     * @returns {Object} - Informações sobre o histórico
     */
    function getHistoryInfo() {
        return {
            totalCommands: _commandHistory.length,
            currentIndex: _currentIndex,
            canUndo: _currentIndex >= 0,
            canRedo: _currentIndex < _commandHistory.length - 1
        };
    }

    // API pública
    return {
        executeCommand,
        undo,
        redo,
        clearHistory,
        setHistoryEnabled,
        getHistoryInfo
    };
})();
