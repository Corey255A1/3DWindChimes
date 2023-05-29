//WunderVision 2023
//www.wundervisionengineering.com
import { WindChime } from "./WindChime";
import { WindChimeRod } from "./WindChimeRod";

export class WindChimeAudio {
    
    public static readonly FREQUENCIES = [
        261.63, // C
        293.66, // D
        329.63, // E
        //349.23, // F
        392.00, // G
        440.00, // A
       // 493.88, // B
    ];

    public static getFrequency(index: number): number {
        index = 10 - index;
        if (index <= 0) { index = 1; }
        else if(index >= 10){ index = 10; }
        
        const normalized = ((index - 1) % this.FREQUENCIES.length);
        return this.FREQUENCIES[normalized] * ((index/this.FREQUENCIES.length) + 1);
    }


    private _audioContext: AudioContext;
    private _oscillator: OscillatorNode;
    private _gainNode: GainNode;
    private _oscillatorRunning: boolean;
    private _windChimeRod:WindChimeRod;
    constructor(windChimeRod: WindChimeRod, audioContext: AudioContext) {
        this._windChimeRod = windChimeRod;
        this._audioContext = audioContext;
        this._oscillatorRunning = false;
        this._oscillator = this._audioContext.createOscillator();
        this._gainNode = this._audioContext.createGain();
        this.initializeAudio();
        this._windChimeRod.addEventListener("impact", this.play.bind(this));
    }

    private initializeAudio(){
        const frequency = WindChimeAudio.getFrequency(this._windChimeRod.length);
        const gain = 0;
        this._oscillator.frequency.setValueAtTime(frequency, this._audioContext.currentTime);
        
        this._gainNode.gain.setValueAtTime(gain, this._audioContext.currentTime);

        this._oscillator.connect(this._gainNode);
        this._gainNode.connect(this._audioContext.destination);
    }

    public play(){
        if(!this._oscillatorRunning){
            this._oscillator.start();
            this._oscillatorRunning = true;
        }
        
        if(this._gainNode.gain.value < 0.8){
            this._gainNode.gain.setValueAtTime(1, this._audioContext.currentTime);
            this._gainNode.gain.setTargetAtTime(0, this._audioContext.currentTime, 0.6);
        }

    }
}