var lowfat = lowfat || {};

var GameScene = cc.Scene.extend({
    soundManager: null,
    gamefield: null,
    gameStateModel: null,

    setup: function () {
        this.soundManager = lowfat.SoundManager();
        this.gameStateModel = lowfat.GameStateModel(this.soundManager);
        this.gameStateModel.init(this);
        this.startBoard();
        this.scheduleUpdate();
    },

    startBoard: function () {
        this.gamefield = new lowfat.Gamefield(this, lowfat.SpriteFactory, this.gameStateModel, lowfat.SoundManager(), cc.director.getWinSize());
        this.gamefield.start();
    },

    update: function (dt) {
        this.gamefield.update(dt);
    },

    onResize: function () {
        var screenSizeInPoints = cc.director.getWinSize();
        this.gamefield.onResize(screenSizeInPoints);
    }
});