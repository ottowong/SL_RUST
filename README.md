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