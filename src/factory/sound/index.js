import source from './01.mp3'
import { Howl } from 'howler'

const sound = new Howl({
  src: [source],
  onplayerror (soundId, err) {
    console.log(soundId, err)
  },
  onunlock (e) {
    console.log('unlocked!')
  },
})

export default sound
