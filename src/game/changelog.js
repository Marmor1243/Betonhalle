import { $ } from '../core/utils.js';
import { CHANGELOG } from '../changelog.js';

export function renderChangelog() {
  const el = $('changelogBody');
  el.innerHTML = CHANGELOG.map(e => `
    <div class="cl-entry">
      <div class="cl-meta"><span class="cl-date">${e.date}</span><span class="cl-title">${e.title}</span></div>
      <ul>${e.items.map(i => `<li>${i}</li>`).join('')}</ul>
    </div>
  `).join('');
  const last = el.lastElementChild;
  if (last) el.scrollTop += last.getBoundingClientRect().top - el.getBoundingClientRect().top;
}
