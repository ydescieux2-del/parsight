/**
 * ShelfCountAudioController — plays the plus (higher) and minus (lower) tones.
 *
 * Expects: toneUp / toneDown AudioTrackAssets (Assets/GeneratedSFX/ShelfCountTone*.wav).
 * Interactive cues use LowLatency playback so the tone lands with the pinch.
 * Must not: decide when to play — Main calls playPlus()/playMinus().
 */
@component
export class ShelfCountAudioController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShelfCountAudioController – plus/minus tones</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Short higher tone played on plus")
  toneUp: AudioTrackAsset

  @input
  @hint("Short lower tone played on minus")
  toneDown: AudioTrackAsset
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Tone volume")
  @widget(new SliderWidget(0, 1, 0.05))
  volume: number = 0.8
  @ui.group_end

  private upAudio: AudioComponent | null = null
  private downAudio: AudioComponent | null = null
  private _plusPlays = 0
  private _minusPlays = 0

  /** Counters for tests: how many times each tone was triggered. */
  get plusPlays(): number { return this._plusPlays }
  get minusPlays(): number { return this._minusPlays }

  onAwake() {
    this.upAudio = this.makeAudio("ToneUp", this.toneUp)
    this.downAudio = this.makeAudio("ToneDown", this.toneDown)
  }

  playPlus(): void {
    this._plusPlays++
    this.play(this.upAudio)
  }

  playMinus(): void {
    this._minusPlays++
    this.play(this.downAudio)
  }

  private makeAudio(name: string, track: AudioTrackAsset): AudioComponent | null {
    if (!track) {
      print("[ShelfCountAudioController] missing audio track for " + name)
      return null
    }
    const so = global.scene.createSceneObject(name)
    so.setParent(this.sceneObject)
    const a = so.createComponent("Component.AudioComponent") as AudioComponent
    a.audioTrack = track
    a.volume = this.volume
    a.playbackMode = Audio.PlaybackMode.LowLatency
    return a
  }

  private play(a: AudioComponent | null): void {
    if (!a) return
    if (a.isPlaying()) a.stop(false)
    a.play(1)
  }
}
