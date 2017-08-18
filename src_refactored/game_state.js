var lowfat = lowfat || {};

lowfat.GameStateModel = function (soundManager) {

    var highScore = 0;
    var score = 0;
    var isFirstGame = true;
    var isTutorialFinished = false;
    var boardState = [];
    var pack = [];
    var nextPack = [];
    var LOCAL_STORAGE_ID = "lowfat_fuse_gamestate";

    function init() {
        // resetLocalStorage();
        load();
    }

    function clearBoardState() {
        boardState = [];
        for (var i = 0; i < (6 * 7); i++) {
            boardState.push(0);
        }
    }

    function updateScore(scoreToSet) {
        score = scoreToSet;
        if (score > highScore) {
            highScore = score;
        }
    }

    function saveScoreOnly(score) {
        updateScore(score);
        save([], 0, [], []);
    }

    function save(boardStateToSet, scoreToSet, packToSet, nextPackToSet) {
        if (boardState.length > 0) {
            boardState = boardStateToSet;
        } else {
            clearBoardState();
        }

        updateScore(scoreToSet);
        pack = packToSet;
        nextPack = nextPackToSet;

        var gameStateVO = {
            score: score,
            highScore: highScore,
            boardState: boardState,
            isTutorialFinished: isTutorialFinished,
            pack: pack,
            nextPack: nextPack,
            isSoundOn: soundManager.getSoundOn(),
            isMusicOn: soundManager.getMusicOn()
        };
        cc.sys.localStorage.setItem(LOCAL_STORAGE_ID, JSON.stringify(gameStateVO));
    }

    function load() {
        var gameStateVO;
        var rawGameState = cc.sys.localStorage.getItem(LOCAL_STORAGE_ID);
        if (rawGameState === undefined) {
            gameStateVO = null;
        } else {
            gameStateVO = JSON.parse(rawGameState);
        }

        if (gameStateVO == null || gameStateVO == "") {
            console.log("No gameState found");
            highScore = 0;
            score = 0;
            isFirstGame = true;
            isTutorialFinished = false;
            pack = [];
            nextPack = [];
            clearBoardState();
        }
        else {
            console.log("GameState found: " + gameStateVO);
            highScore = gameStateVO.highScore;
            score = gameStateVO.score;
            isFirstGame = false;
            isTutorialFinished = gameStateVO.isTutorialFinished === undefined ? false : gameStateVO.isTutorialFinished;
            pack = gameStateVO.pack;
            nextPack = gameStateVO.nextPack;
            boardState = gameStateVO.boardState;
            soundManager.isSoundOn = gameStateVO.isSoundOn === undefined ? true : gameStateVO.isSoundOn;
            soundManager.isMusicOn = gameStateVO.isMusicOn === undefined ? true : gameStateVO.isMusicOn;
        }
    }

    function resetLocalStorage() {
        highScore = 0;
        save([], 0, [], []);
    }

    function setIsTutorialFinished(value) {
        isTutorialFinished = value;
    }

    function getIsTutorialFinished() {
        return isTutorialFinished;
    }

    function getPack() {
        return pack;
    }

    function getNextPack() {
        return nextPack;
    }

    function getScore() {
        return score;
    }

    function getHighScore() {
        return highScore;
    }

    function getBoardState() {
        return boardState;
    }

    function getIsFirstGame() {
        return isFirstGame;
    }

    function setScore(value) {
        score = value;
    }

    return {
        init: init,
        save: save,
        saveScoreOnly: saveScoreOnly,
        setIsTutorialFinished: setIsTutorialFinished,
        getIsTutorialFinished: getIsTutorialFinished,
        getPack: getPack,
        getNextPack: getNextPack,
        getScore: getScore,
        setScore: setScore,
        getHighScore: getHighScore,
        getBoardState: getBoardState,
        getIsFirstGame: getIsFirstGame
    };
};