const songs = [
  {
    title: '浮萍',
    artist: '云汐',
    src: 'assets/mp3/music0.mp3',
    cover: 'assets/img/record0.jpg',
    bg: 'assets/img/bg0.png',
    lyrics: [
      [0, '浮萍随水轻轻转，映着半池微光。'],
      [24, '风从水面掠过，留下细碎的声响。'],
      [48, '一片叶影漂来，又慢慢漂向远方。'],
      [72, '心事不必停靠，顺着旋律流淌。'],
      [96, '清浅的波纹里，藏着片刻安静。'],
      [120, '夜色落下之前，把梦交给水乡。'],
      [144, '浮萍没有归处，却也不曾慌张。'],
      [168, '音乐继续向前，像河面慢慢发亮。']
    ]
  },
  {
    title: '边草',
    artist: '北叶',
    src: 'assets/mp3/music1.mp3',
    cover: 'assets/img/record1.jpg',
    bg: 'assets/img/bg1.png',
    lyrics: [
      [0, '边草低低生长，贴着风的方向。'],
      [16, '北叶落在脚边，带来一点清凉。'],
      [32, '雨声穿过竹影，打湿旧时长廊。'],
      [48, '远处有人轻唱，声音越过山墙。'],
      [64, '一盏灯慢慢亮起，照见夜色微茫。'],
      [80, '边草不问归路，只随季节收藏。'],
      [96, '北叶翻过掌心，像一封短短来信。'],
      [112, '旋律停在耳畔，把夜雨轻轻安放。']
    ]
  },
  {
    title: '脆枝',
    artist: '远山',
    src: 'assets/mp3/music2.mp3',
    cover: 'assets/img/record2.jpg',
    bg: 'assets/img/bg2.png',
    lyrics: [
      [0, '脆枝轻轻折响，惊动清晨薄雾。'],
      [20, '山风越过屋檐，带来远处花香。'],
      [40, '一封信没有署名，却写满旧日时光。'],
      [60, '枝头露水微凉，映出天空的蓝。'],
      [80, '脚步经过林间，叶影慢慢摇晃。'],
      [100, '脆枝落入泥土，像一句未说完的话。'],
      [120, '远山仍在前方，等风吹开云浪。'],
      [140, '音乐回到心里，把安静继续延长。']
    ]
  }
];

const audio = document.querySelector('#audio');
const backgroundLayer = document.querySelector('#backgroundLayer');
const cover = document.querySelector('#cover');
const miniCover = document.querySelector('#miniCover');
const discWrap = document.querySelector('#discWrap');
const songTitle = document.querySelector('#songTitle');
const songArtist = document.querySelector('#songArtist');
const miniTitle = document.querySelector('#miniTitle');
const miniArtist = document.querySelector('#miniArtist');
const miniFavoriteState = document.querySelector('#miniFavoriteState');
const lyricsList = document.querySelector('#lyricsList');
const playStateText = document.querySelector('#playStateText');
const currentTimeEl = document.querySelector('#currentTime');
const durationEl = document.querySelector('#duration');
const progress = document.querySelector('#progress');
const prevBtn = document.querySelector('#prevBtn');
const playBtn = document.querySelector('#playBtn');
const nextBtn = document.querySelector('#nextBtn');
const favoriteBtn = document.querySelector('#favoriteBtn');
const modeSwitchBtn = document.querySelector('#modeSwitchBtn');
const modeSwitchIcon = document.querySelector('#modeSwitchIcon');
const volume = document.querySelector('#volume');
const volumeValue = document.querySelector('#volumeValue');
const collapseVolume = document.querySelector('#collapseVolume');
const collapseVolumeValue = document.querySelector('#collapseVolumeValue');
const speedControl = document.querySelector('#speedControl');
const speedValue = document.querySelector('#speedValue');
const playlist = document.querySelector('#playlist');
const playlistPanel = document.querySelector('#playlistPanel');
const mainLayout = document.querySelector('#mainLayout');
const togglePlaylistBtn = document.querySelector('#togglePlaylistBtn');
const playerBar = document.querySelector('#playerBar');
const togglePlayerBtn = document.querySelector('#togglePlayerBtn');
const songSearch = document.querySelector('#songSearch');
const themeSelect = document.querySelector('#themeSelect');

let currentIndex = 0;
let searchKeyword = '';
let playMode = 'order';
let pendingSeek = null;
let isSeeking = false;
const favoriteSet = new Set(JSON.parse(localStorage.getItem('favoriteSongs') || '[]'));


const modeMeta = {
  order: { name: '顺序播放', icon: '→' },
  loop: { name: '单曲循环', icon: '↻' },
  random: { name: '随机播放', icon: '⤭' }
};
const modeSequence = ['order', 'loop', 'random'];
const themeNames = ['blue', 'purple', 'green', 'amber'];

function applyTheme(themeName) {
  const safeTheme = themeNames.includes(themeName) ? themeName : 'blue';
  document.body.classList.remove(...themeNames.map(name => `theme-${name}`));
  document.body.classList.add(`theme-${safeTheme}`);
  if (themeSelect) themeSelect.value = safeTheme;
  localStorage.setItem('playerTheme', safeTheme);
}

function initTheme() {
  const savedTheme = localStorage.getItem('playerTheme') || 'blue';
  applyTheme(savedTheme);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function matchSong(song, keyword) {
  if (!keyword) return true;
  const target = `${song.title} ${song.artist}`.toLowerCase();
  return target.includes(keyword);
}

function songKey(index = currentIndex) {
  return songs[index].title;
}

function saveFavorites() {
  localStorage.setItem('favoriteSongs', JSON.stringify(Array.from(favoriteSet)));
}

function isFavorite(index = currentIndex) {
  return favoriteSet.has(songKey(index));
}


function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const minute = Math.floor(seconds / 60).toString().padStart(2, '0');
  const second = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minute}:${second}`;
}

function parseTimeInput(text) {
  const value = String(text).trim().replace('：', ':');
  if (!value) return null;
  if (value.includes(':')) {
    const parts = value.split(':');
    if (parts.length !== 2) return null;
    const minute = Number(parts[0]);
    const second = Number(parts[1]);
    if (!Number.isFinite(minute) || !Number.isFinite(second) || minute < 0 || second < 0 || second >= 60) return null;
    return minute * 60 + second;
  }
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return seconds;
}

function clampTime(seconds) {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return Math.max(0, seconds);
  return Math.min(Math.max(0, seconds), audio.duration);
}

function renderLyrics(song) {
  lyricsList.innerHTML = song.lyrics.map(([time, line], index) => (
    `<p class="${index === 0 ? 'active' : ''}" data-time="${time}">${line}</p>`
  )).join('');
}

function updateLyricByTime(seconds) {
  const lines = Array.from(lyricsList.querySelectorAll('p'));
  if (!lines.length) return;
  let activeIndex = 0;
  lines.forEach((line, index) => {
    const lineTime = Number(line.dataset.time);
    if (Number.isFinite(lineTime) && seconds >= lineTime) activeIndex = index;
  });
  lines.forEach((line, index) => line.classList.toggle('active', index === activeIndex));
  const activeLine = lines[activeIndex];
  if (activeLine) {
    const targetTop = activeLine.offsetTop - lyricsList.clientHeight / 2 + activeLine.clientHeight / 2;
    lyricsList.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  }
}

function renderPlaylist() {
  const filteredSongs = songs
    .map((song, index) => ({ song, index }))
    .filter(({ song }) => matchSong(song, searchKeyword));

  if (!filteredSongs.length) {
    playlist.innerHTML = '<li class="playlist-empty" aria-live="polite">没有找到匹配的歌曲</li>';
    return;
  }

  playlist.innerHTML = filteredSongs.map(({ song, index }) => {
    const favoriteMark = isFavorite(index) ? '<em class="favorite-mark" aria-label="已收藏">♥</em>' : '';
    return `
      <li class="${index === currentIndex ? 'active' : ''}" data-index="${index}">
        <span class="cover-thumb"><img src="${song.cover}" alt="${song.title}封面" />${favoriteMark}</span>
        <div><strong>${song.title}</strong><small>${song.artist}</small></div>
        <span>${index === currentIndex ? '播放中' : '选择'}</span>
      </li>`;
  }).join('');
}
function loadSong(index, autoPlay = false) {
  currentIndex = (index + songs.length) % songs.length;
  const song = songs[currentIndex];
  audio.src = song.src;
  audio.load();
  cover.src = song.cover;
  cover.alt = `${song.title}封面`;
  miniCover.src = song.cover;
  miniCover.alt = `${song.title}封面`;
  backgroundLayer.style.backgroundImage = `url("${song.bg}")`;
  songTitle.textContent = song.title;
  songArtist.textContent = `演唱：${song.artist}`;
  miniTitle.textContent = song.title;
  miniArtist.textContent = song.artist;
  renderLyrics(song);
  renderPlaylist();
  updateFavoriteButtons();
  updateSpeed();
  currentTimeEl.textContent = '00:00';
  durationEl.textContent = '00:00';
  progress.value = '0';
  playStateText.textContent = autoPlay ? '准备播放' : '当前未播放';
  if (autoPlay) playAudio();
  else updatePlayButton(false);
}

function updatePlayButton(isPlaying) {
  playBtn.textContent = isPlaying ? '❚❚' : '▶';
  discWrap.classList.toggle('playing', isPlaying);
  playStateText.textContent = isPlaying ? '正在播放' : '已暂停';
}

function playAudio() {
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.then(() => updatePlayButton(true)).catch(() => {
      playStateText.textContent = '请手动点击播放';
      updatePlayButton(false);
    });
  } else updatePlayButton(true);
}

function pauseAudio() {
  audio.pause();
  updatePlayButton(false);
}

function togglePlay() {
  if (audio.paused) playAudio();
  else pauseAudio();
}

function randomIndex() {
  if (songs.length <= 1) return currentIndex;
  let next = Math.floor(Math.random() * songs.length);
  while (next === currentIndex) next = Math.floor(Math.random() * songs.length);
  return next;
}

function playNext() {
  if (playMode === 'random') loadSong(randomIndex(), true);
  else loadSong(currentIndex + 1, true);
}

function playPrev() {
  if (playMode === 'random') loadSong(randomIndex(), true);
  else loadSong(currentIndex - 1, true);
}

function setPlayMode(mode) {
  if (!modeMeta[mode]) return;
  playMode = mode;
  if (modeSwitchBtn) {
    modeSwitchBtn.dataset.mode = mode;
    modeSwitchBtn.title = `当前：${modeMeta[mode].name}，点击切换`;
    modeSwitchBtn.setAttribute('aria-label', `当前：${modeMeta[mode].name}，点击切换播放模式`);
  }
  if (modeSwitchIcon) modeSwitchIcon.textContent = modeMeta[mode].icon;
}

function cyclePlayMode() {
  const currentPos = modeSequence.indexOf(playMode);
  const nextMode = modeSequence[(currentPos + 1) % modeSequence.length];
  setPlayMode(nextMode);
}

function applySeek(seconds, autoPlay = false) {
  const target = clampTime(seconds);
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
    pendingSeek = target;
    currentTimeEl.textContent = formatTime(target);
    return;
  }
  audio.currentTime = target;
  currentTimeEl.textContent = formatTime(target);
  progress.value = String(Math.round((target / audio.duration) * 1000));
  updateLyricByTime(target);
  if (autoPlay) playAudio();
}

function editCurrentTime() {
  if (currentTimeEl.querySelector('input')) return;
  const oldText = currentTimeEl.textContent;
  const input = document.createElement('input');
  input.className = 'time-edit';
  input.value = oldText;
  input.setAttribute('aria-label', '输入播放时间');
  currentTimeEl.textContent = '';
  currentTimeEl.appendChild(input);
  input.focus();
  input.select();
  let finished = false;
  const commit = () => {
    if (finished) return;
    finished = true;
    const parsed = parseTimeInput(input.value);
    currentTimeEl.textContent = parsed === null ? oldText : formatTime(parsed);
    if (parsed !== null) applySeek(parsed, false);
  };
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') commit();
    if (event.key === 'Escape') {
      finished = true;
      currentTimeEl.textContent = oldText;
    }
  });
  input.addEventListener('blur', commit, { once: true });
}

function updateVolume(source = 'full') {
  const sourceSlider = source === 'collapsed' ? collapseVolume : volume;
  const value = Number(sourceSlider.value);
  audio.volume = Math.min(1, Math.max(0, value));
  volume.value = String(audio.volume);
  collapseVolume.value = String(audio.volume);
  const percent = `${Math.round(audio.volume * 100)}%`;
  volumeValue.textContent = percent;
  collapseVolumeValue.textContent = percent;
}


function updateSpeed() {
  const rate = Math.min(2, Math.max(0.5, Number(speedControl.value)));
  audio.playbackRate = rate;
  speedControl.value = String(rate);
  speedValue.textContent = `${rate.toFixed(1)}倍`;
}

function updateFavoriteButtons() {
  const favored = isFavorite();
  favoriteBtn.classList.toggle('active', favored);
  favoriteBtn.setAttribute('aria-pressed', String(favored));
  favoriteBtn.textContent = favored ? '♥' : '♡';
  favoriteBtn.title = favored ? '取消收藏' : '收藏';
  favoriteBtn.setAttribute('aria-label', favored ? '取消收藏当前歌曲' : '收藏当前歌曲');
  miniFavoriteState.textContent = favored ? '♥' : '';
}

function toggleFavorite() {
  const key = songKey();
  if (favoriteSet.has(key)) favoriteSet.delete(key);
  else favoriteSet.add(key);
  saveFavorites();
  updateFavoriteButtons();
  renderPlaylist();
}


if (themeSelect) {
  themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
}

if (songSearch) {
  songSearch.addEventListener('input', () => {
    searchKeyword = normalizeText(songSearch.value);
    renderPlaylist();
  });
}

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', playPrev);
nextBtn.addEventListener('click', playNext);
favoriteBtn.addEventListener('click', toggleFavorite);
if (modeSwitchBtn) modeSwitchBtn.addEventListener('click', cyclePlayMode);
progress.addEventListener('input', () => {
  isSeeking = true;
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    const target = Number(progress.value) / 1000 * audio.duration;
    currentTimeEl.textContent = formatTime(target);
    updateLyricByTime(target);
  }
});
progress.addEventListener('change', () => {
  isSeeking = false;
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    const target = Number(progress.value) / 1000 * audio.duration;
    applySeek(target, false);
  }
});
volume.addEventListener('input', () => updateVolume('full'));
volume.addEventListener('change', () => updateVolume('full'));
collapseVolume.addEventListener('input', () => updateVolume('collapsed'));
collapseVolume.addEventListener('change', () => updateVolume('collapsed'));
speedControl.addEventListener('input', updateSpeed);
speedControl.addEventListener('change', updateSpeed);
currentTimeEl.addEventListener('click', editCurrentTime);
currentTimeEl.addEventListener('keydown', event => {
  if (event.key === 'Enter') editCurrentTime();
});
togglePlaylistBtn.addEventListener('click', () => {
  const hidden = playlistPanel.classList.toggle('hidden');
  mainLayout.classList.toggle('list-hidden', hidden);
  togglePlaylistBtn.textContent = hidden ? '展开播放列表' : '收起播放列表';
});

togglePlayerBtn.addEventListener('click', () => {
  const collapsed = playerBar.classList.toggle('collapsed');
  togglePlayerBtn.title = collapsed ? '展开播放器' : '收起播放器';
  togglePlayerBtn.setAttribute('aria-label', collapsed ? '展开播放器' : '收起播放器');
});

playlist.addEventListener('click', event => {
  const item = event.target.closest('li[data-index]');
  if (!item) return;
  loadSong(Number(item.dataset.index), true);
});
audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
  if (pendingSeek !== null) {
    applySeek(pendingSeek, false);
    pendingSeek = null;
  }
});
audio.addEventListener('timeupdate', () => {
  if (isSeeking) return;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    progress.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
  }
  updateLyricByTime(audio.currentTime);
});
audio.addEventListener('ended', () => {
  if (playMode === 'loop') {
    audio.currentTime = 0;
    playAudio();
    return;
  }
  if (playMode === 'random') {
    loadSong(randomIndex(), true);
    return;
  }
  loadSong(currentIndex + 1, true);
});
window.addEventListener('keydown', event => {
  if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
  if (event.code === 'Space') {
    event.preventDefault();
    togglePlay();
  }
  if (event.code === 'ArrowRight') applySeek(audio.currentTime + 5, false);
  if (event.code === 'ArrowLeft') applySeek(audio.currentTime - 5, false);
});

initTheme();
updateVolume('full');
setPlayMode('order');
loadSong(0, false);

window.__playerCheck = {
  formatTime,
  parseTimeInput,
  setPlayMode,
  applySeek,
  playNext,
  playPrev,
  getMode: () => playMode,
  getIndex: () => currentIndex,
  updateSpeed,
  toggleFavorite,
  isFavorite,
  applyTheme,
  matchSong
};
