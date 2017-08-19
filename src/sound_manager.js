var lowfat = lowfat || {};

lowfat.SoundManager = function () {
    var isSoundOn = true;
    var isMusicOn = true;
    var isMusicPlaying = false;

    var MATCH_SOUND_MAX = 5;
    var MUSIC_FILE_NAME = "res/friendly_faces.mp3";

    function playSound(soundId) {
        if (!isSoundOn) {
            return;
        }
        cc.audioEngine.playEffect(res[soundId], false);
    }

    function playMatchSound(cascadingLength) {
        var soundIndex = cascadingLength;
        if (cascadingLength > MATCH_SOUND_MAX) {
            soundIndex = MATCH_SOUND_MAX;
        }
        playSound("sound_match_" + soundIndex.toString());
    }

    function playSwapSound () {
        playSound("sound_swap");
    }

    function playDropSound() {
        playSound("sound_drop");
    }

    function playMusic() {
        if (isMusicPlaying == true || isMusicOn == false) {
            return;
        }
        isMusicPlaying = true;
        cc.audioEngine.playMusic(MUSIC_FILE_NAME, true);
    }

    function stopMusic() {
        if (isMusicPlaying == false) {
            return;
        }
        isMusicPlaying = false;
        cc.audioEngine.stopMusic();
    }

    function toggleSoundOn() {
        isSoundOn = !isSoundOn;
    }

    function getSoundOn() {
        return isSoundOn;
    }

    function setSoundOn(value) {
        isSoundOn = value;
    }

    function toggleMusicOn() {
        isMusicOn = !isMusicOn;
        if (isMusicOn) {
            playMusic();
        } else {
            stopMusic();
        }
    }

    function getMusicOn() {
        return isMusicOn;
    }

    function setMusicOn(value) {
        isMusicOn = value;
    }

    return {
        playMatchSound: playMatchSound,
        playSwapSound: playSwapSound,
        playDropSound: playDropSound,
        playMusic: playMusic,
        stopMusic: stopMusic,
        toggleSoundOn: toggleSoundOn,
        toggleMusicOn: toggleMusicOn,
        getSoundOn: getSoundOn,
        getMusicOn: getMusicOn,
        setSoundOn: setSoundOn,
        setMusicOn: setMusicOn
    }
};