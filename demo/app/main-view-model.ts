import "./async-await";
import * as app from "tns-core-modules/application";
import * as color from "tns-core-modules/color";
import * as platform from "tns-core-modules/platform";
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as timer from "tns-core-modules/timer";
import { Observable } from "tns-core-modules/data/observable";
import { knownFolders, File } from "tns-core-modules/file-system";
import { Page } from "tns-core-modules/ui/page";
import { Slider } from "tns-core-modules/ui/slider";
import {
  TNSPlayer,
  AudioPlayerOptions
} from "nativescript-audio-player";

declare const android;

export class AudioDemo extends Observable {
  @ObservableProperty() public isPlaying: boolean;
  @ObservableProperty() public currentVolume;
  @ObservableProperty() public audioTrackDuration;
  @ObservableProperty() public remainingDuration; // used to show the remaining time of the audio track
  private _player: TNSPlayer;
  private _audioSessionId;
  private _page;
  private _audioUrls: Array<any> = [
    {
      name: "Fight Club",
      pic: "~/pics/canoe_girl.jpeg",
      url: "http://www.noiseaddicts.com/samples_1w72b820/2514.mp3"
    },
    {
      name: "To The Bat Cave!!!",
      pic: "~/pics/bears.jpeg",
      url: "http://www.noiseaddicts.com/samples_1w72b820/17.mp3"
    },
    {
      name: "Marlon Brando",
      pic: "~/pics/northern_lights.jpeg",
      url: "http://www.noiseaddicts.com/samples_1w72b820/47.mp3"
    }
  ];
  private _slider: Slider;

  constructor(page: Page) {
    super();
    this._player = new TNSPlayer();
    this._player.debug = true; // set true for tns_player logs

    this.currentVolume = 1;
    this._slider = page.getViewById("volumeSlider") as Slider;

    // Set player volume
    if (this._slider) {
      this._slider.on("valueChange", (data: any) => {
        this._player.volume = this._slider.value / 100;
      });
    }
  }

  /***** AUDIO PLAYER *****/

  public async playAudio(filepath: string, fileType: string) {
    try {
      const playerOptions: AudioPlayerOptions = {
        audioFile: filepath,
        loop: false,
        completeCallback: async () => {
          alert("Audio file complete.");
          await this._player.dispose();
          this.isPlaying = false;
          console.log("player disposed");
        },
        errorCallback: errorObject => {
          console.log(JSON.stringify(errorObject));
          this.isPlaying = false;
        },
        infoCallback: args => {
          dialogs.alert("Info callback: " + args.info);
          console.log(JSON.stringify(args));
        }
      };

      this.isPlaying = true;

      if (fileType === "localFile") {
        await this._player.playFromFile(playerOptions).catch(() => {
          this.isPlaying = false;
        });
        this.isPlaying = true;
        this.audioTrackDuration = await this._player.getAudioTrackDuration();
        // start audio duration tracking
        this._startDurationTracking(this.audioTrackDuration);
      } else if (fileType === "remoteFile") {
        await this._player.playFromUrl(playerOptions).catch(() => {
          this.isPlaying = false;
        });
        this.isPlaying = true;
      }
    } catch (ex) {
      console.log(ex);
    }
  }

  /**
   * PLAY REMOTE AUDIO FILE
   */
  public playRemoteFile(args) {
    console.log("playRemoteFile");
    const filepath = "http://www.noiseaddicts.com/samples_1w72b820/2514.mp3";

    this.playAudio(filepath, "remoteFile");
  }

  public resumePlayer() {
    console.log(JSON.stringify(this._player));
    this._player.resume();
  }

  /**
   * PLAY LOCAL AUDIO FILE from app folder
   */
  public playLocalFile(args) {
    let filepath = "~/audio/angel.mp3";
    this.playAudio(filepath, "localFile");
  }

  /**
   * PAUSE PLAYING
   */
  public async pauseAudio(args) {
    try {
      await this._player.pause();
      this.isPlaying = false;
    } catch (error) {
      console.log(error);
      this.isPlaying = true;
    }
  }

  public async stopPlaying(args) {
    await this._player.dispose();
    alert("Media Player Disposed.");
  }

  /**
   * RESUME PLAYING
   */
  public resumePlaying(args) {
    console.log("START");
    this._player.play();
  }

  public playSpeed1() {
    this._player.changePlayerSpeed(1);
  }

  public playSpeed15() {
    this._player.changePlayerSpeed(1.5);
  }

  public playSpeed2() {
    this._player.changePlayerSpeed(2);
  }

  private platformExtension() {
    // 'mp3'
    return `${app.android ? "m4a" : "caf"}`;
  }

  private async _startDurationTracking(duration) {
    if (this._player && this._player.isAudioPlaying()) {
      const timerId = timer.setInterval(() => {
        this.remainingDuration = duration - this._player.currentTime;
        // console.log(`this.remainingDuration = ${this.remainingDuration}`);
      }, 1000);
    }
  }
}

export function ObservableProperty() {
  return (obj: Observable, key: string) => {
    let storedValue = obj[key];

    Object.defineProperty(obj, key, {
      get: function() {
        return storedValue;
      },
      set: function(value) {
        if (storedValue === value) {
          return;
        }
        storedValue = value;
        this.notify({
          eventName: Observable.propertyChangeEvent,
          propertyName: key,
          object: this,
          value
        });
      },
      enumerable: true,
      configurable: true
    });
  };
}
