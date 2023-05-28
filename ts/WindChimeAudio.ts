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
    constructor(windChime: WindChimeRod, audioContext: AudioContext) {
        this._audioContext = audioContext;
        var frequency = WindChimeAudio.getFrequency(windChime.length);
        var gain = 1;
        this._oscillator = this._audioContext.createOscillator();
        this._oscillator.frequency.setValueAtTime(frequency, this._audioContext.currentTime);
        this._oscillatorRunning = false;

        this._gainNode = this._audioContext.createGain();
        this._gainNode.gain.setValueAtTime(gain, this._audioContext.currentTime);

        this._oscillator.connect(this._gainNode);
        this._gainNode.connect(this._audioContext.destination);
    }

    public play(){
        if(!this._oscillatorRunning){
            this._oscillator.start();
            this._oscillatorRunning = true;
        }        
        this._gainNode.gain.setValueAtTime(1, this._audioContext.currentTime);
        this._gainNode.gain.setTargetAtTime(0, this._audioContext.currentTime, 0.8);
        console.log(this._gainNode.gain.value)
    }
}