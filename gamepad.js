//Script che si occupa di leggere e gestire l'input da gamepad
var gamepad;
let mappings = {
    A : 0,
    B : 1,
    X : 2,
    Y : 3,
    LB: 4,
    RB : 5,
    LT : 6,
    RT : 7,
    BACK : 8,
    START : 9,
    LSTICK : 10,
    RSTICK : 11,
    UP : 12,
    DOWN : 13,
    LEFT : 14,
    RIGHT : 15,
    POWER : 16,
    LEFT_STICK_X: 0,
    LEFT_STICK_Y: 1, //Se levetta su valore = -1 
    RIGHT_STICK_X: 2,
    RIGHT_STICK_Y: 3, //Se levetta su valore = -1 
};
let lastButtons = new Array();
let lastAxes = new Array();
let stickThreshold = 0.5; //Soglia minima per considerare l'inclinazione della levetta "attiva" 

window.addEventListener("gamepadconnected", connecthandler);
function connecthandler(e) {
    //alert("Collegato controller");
    requestAnimationFrame(gamepadPolling); //Avvio il processo di polling per il gamepad
}

function gamepadPolling() {
    //Faccio un controllo per trovare i gamepad collegati
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    let atLeastOneGamepad = false; //Variabile di controllo per verificare se almeno un gamepad è collegato
    for (var i = 0; i < gamepads.length; i++) {
        if(!gamepads[i])
            continue;
        atLeastOneGamepad = true;
        let buttonsPressed = gamepads[i].buttons.map((curr) => {return curr.value == 1.0});//Ottento lista dei bottoni premuti
        let axes = gamepads[i].axes;//Posizione attuale levette joystick

        //Movimento in avanti con Freccia su O tasto RT O levetta sinistra in avanti
        if(buttonsPressed[mappings.UP] || buttonsPressed[mappings.RT] ||
            axes[mappings.LEFT_STICK_Y]<-stickThreshold)
            key[KEYS.W] = true; //Mappo il movimento come se fosse stato premuto il tasto W su tastiera
        else if(lastButtons[mappings.UP] || lastButtons[mappings.RT] || 
            lastAxes[mappings.LEFT_STICK_Y]<-stickThreshold)
            key[KEYS.W] = false; //Disattivo il movimento solo se prima era attivo sul joystick

        //Movimento indientro con Freccia giu O tasto LT O levetta sinistra indietro
        if(buttonsPressed[mappings.DOWN] || buttonsPressed[mappings.LT] ||
            axes[mappings.LEFT_STICK_Y]>stickThreshold)
            key[KEYS.S] = true;
        else if(lastButtons[mappings.DOWN] || lastButtons[mappings.LT]
            || lastAxes[mappings.LEFT_STICK_Y]>stickThreshold)
            key[KEYS.S] = false;

        //Movimento a sinistra con Freccia sinistra O levetta sinistra a sinistra
        if(buttonsPressed[mappings.LEFT] || axes[mappings.LEFT_STICK_X]<-stickThreshold)
            key[KEYS.A] = true;
        else if(lastButtons[mappings.LEFT] || lastAxes[mappings.LEFT_STICK_X]<-stickThreshold)
            key[KEYS.A] = false;

        //Movimento a destra con Freccia destra O levetta sinistra a destra 
        if(buttonsPressed[mappings.RIGHT] || axes[mappings.LEFT_STICK_X]>stickThreshold)
            key[KEYS.D] = true;
        else if(lastButtons[mappings.RIGHT] || lastAxes[mappings.LEFT_STICK_X]>stickThreshold)
            key[KEYS.D] = false;

        lastButtons = buttonsPressed;
        lastAxes = axes;
    }
    if(atLeastOneGamepad) requestAnimationFrame(gamepadPolling);
}
