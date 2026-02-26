/**
 * Extract YouTube video ID from various URL formats.
 * Supports: watch?v=, embed/, youtu.be/, /v/, /shorts/, m.youtube.com, www, etc.
 */
export function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  // 11-char ID: alphanumeric, hyphen, underscore
  const idPattern = '([a-zA-Z0-9_-]{11})';
  const patterns = [
    new RegExp('(?:youtube\\.com\\/watch\\?v=)' + idPattern, 'i'),
    new RegExp('(?:youtube\\.com\\/embed\\/)' + idPattern, 'i'),
    new RegExp('(?:youtube\\.com\\/v\\/)' + idPattern, 'i'),
    new RegExp('(?:youtube\\.com\\/shorts\\/)' + idPattern, 'i'),
    new RegExp('(?:youtu\\.be\\/)' + idPattern, 'i'),
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }
  return null;
}

export function getYouTubeEmbedUrl(url) {
  const id = getYouTubeVideoId(url);
  return id
    ? `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0&autoplay=1&controls=0&disablekb=1&fs=0&iv_load_policy=3`
    : null;
}

export function getYouTubeThumbnail(url) {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}
