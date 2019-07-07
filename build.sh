#!/bin/bash
echo "usage: build.sh [action] [target] [mode]"
echo ""

if [ -z $1 ]; then
	ACTION="compile"
	echo "No action provided, using default: $ACTION"
else
	ACTION=$1
fi

if [ -z $2 ]; then
	TARGET="test"
	echo "No target provided, using default: $TARGET"
else
	TARGET=$2
fi

if [ -z $3 ]; then
	MODE="release"
	echo "No mode provided, using default: $MODE"
else
	MODE=$3
fi

echo "action: $ACTION, target: $TARGET, mode: $MODE"
echo ""

if [[ "$TARGET" == "test" ]]
then
    TARGET_DIR="lowfatapps.com/fuse_tst"
    PAGE_TITLE="Fuse TEST"
    GOOGLE_TRACKING_ID="UA-24924325-9"
    GAME_ANALYTICS_GAME_KEY="db211dd0cb86a7a10471e5806854dc49"
    GAME_ANALYTICS_SECRET_KEY="43dc46da23253ad3d8de2c63af1938dc1948d3c8"
    PROJECT_SHOW_FPS="true"
elif [[ "$TARGET" == "prod" ]]
then
    TARGET_DIR="lowfatapps.com/fuse"
    PAGE_TITLE="Fuse"
    GOOGLE_TRACKING_ID="UA-24924325-8"
    GAME_ANALYTICS_GAME_KEY="65f90eb15ff36cfa091f1cc7d9800a75"
    GAME_ANALYTICS_SECRET_KEY="eee0326b070dd061b50692cfd51ea4c97e31d131"
    PROJECT_SHOW_FPS="false"
else
    echo "Unidentified target parameter ($TARGET) | available options: test, prod"
    exit 64
fi

echo "Running cocos compile"
cocos compile -p web -m $MODE

echo ""
echo "Copying favicon"
cp -r favicon publish/html5/

echo "Replacing page title to \"$PAGE_TITLE\""
sed -i "" "s/PAGE_TITLE/$PAGE_TITLE/g" publish/html5/index.html



echo "Replacing google tracking ID to \"$GOOGLE_TRACKING_ID\""
sed -i "" "s/GOOGLE_TRACKING_ID/$GOOGLE_TRACKING_ID/g" publish/html5/index.html

echo "Replacing game analytics game key and secret key to \"$GAME_ANALYTICS_GAME_KEY\" : \"$GAME_ANALYTICS_SECRET_KEY\""
sed -i "" "s/GAME_ANALYTICS_GAME_KEY/$GAME_ANALYTICS_GAME_KEY/g" publish/html5/index.html
sed -i "" "s/GAME_ANALYTICS_SECRET_KEY/$GAME_ANALYTICS_SECRET_KEY/g" publish/html5/index.html

echo "Replacing FPS counter param to \"$PROJECT_SHOW_FPS\""
sed -i "" "s/\"showFPS\": true/\"showFPS\": PROJECT_SHOW_FPS/g" publish/html5/project.json
sed -i "" "s/\"showFPS\": false/\"showFPS\": PROJECT_SHOW_FPS/g" publish/html5/project.json
sed -i "" "s/\"showFPS\": PROJECT_SHOW_FPS/\"showFPS\": $PROJECT_SHOW_FPS/g" publish/html5/project.json

echo ""

if [[ "$ACTION" == "deploy" ]]
then
    echo "Uploading to $TARGET_DIR"
    scp -r publish/html5/* sdrago-seed@lowfatapps.com:$TARGET_DIR
fi