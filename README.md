# SL RUST
A Rust+ Python application

## Get Stuff Set Up
We use the JS stuff to get the player token since the Python one is more hassle, and doesn't actually work (for me).
Run this:
```
npx @liamcottle/rustplus.js fcm-register
```
login through steam in the window that pops up.

Then run:
```
npx @liamcottle/rustplus.js fcm-listen
```
And pair with some smart devive in game, in order to get your playerToken and playerId (Steam ID).
Put these in the .env
Keep this running, since you can also use it to get device (entity) IDs.
Alternatively, you can whack your smart device with a rock (in-game) and F1 + 'combatlog' 10s later, and take the 2nd ID.

Requires the following Python libraries to be installed:
```
pip install rustplus flask python-dotenv flask-socketio pillow requests battlemetrics
```
