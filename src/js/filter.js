(() => {
  const state = { cat: '', assist: '', status: '', q: '' };
  const cards = [...document.querySelectorAll('#grid .card')];
  const apply = () => {
    let n = 0;
    for (const el of cards) {
      const d = el.dataset;
      const show = (!state.cat || d.cat === state.cat) && (!state.status || d.status === state.status) &&
        (!state.assist || d.assist.split(' ').includes(state.assist)) && (!state.q || d.text.includes(state.q));
      el.hidden = !show; n += show;
    }
    document.getElementById('count').textContent = n;
    document.getElementById('empty').hidden = n > 0;
  };
  document.querySelectorAll('.chips').forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    g.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    state[g.dataset.group] = b.dataset.v; apply();
  }));
  document.getElementById('q').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); apply(); });
})();
