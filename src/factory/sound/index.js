import { Howl } from 'howler';
import source from './01.mp3';

const sound = new Howl({
  src: [source],
  onplayerror(soundId, err) {
    console.log(soundId, err);
  },
  onunlock() {
    console.log('unlocked!');
  },
});

export default sound;
