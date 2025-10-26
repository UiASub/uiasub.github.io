(function(){
  'use strict';
  function renderCard(post){
    var col = document.createElement('div');
    col.className = 'col-md-4 mb-4';

    var article = document.createElement('article');
    article.className = 'card h-100 card-news shadow-sm card-hover';

    var cover = document.createElement('div');
    cover.className = 'cover-image';

    if(post.image){
      var img = document.createElement('img');
      img.className = 'card-img-top';
      img.src = post.image;
      img.alt = post.title || 'Nyhet';
      cover.appendChild(img);
    }

    var badge = document.createElement('span');
    badge.className = 'badge position-absolute badge-custom';
    badge.style.right = '12px';
    badge.style.top = '12px';
    badge.textContent = post.category || 'Nyhet';
    cover.appendChild(badge);

    article.appendChild(cover);

    var body = document.createElement('div');
    body.className = 'card-body d-flex flex-column';

    var h3 = document.createElement('h3');
    h3.className = 'card-title mb-2';
    var a = document.createElement('a');
    a.href = post.url || '#';
    a.textContent = post.title || '';
    h3.appendChild(a);
    body.appendChild(h3);

    var p = document.createElement('p');
    p.className = 'card-text mb-3';
    p.textContent = post.excerpt || '';
    body.appendChild(p);

    var footer = document.createElement('div');
    footer.className = 'mt-auto d-flex justify-content-between align-items-center';

    var read = document.createElement('a');
    read.className = 'btn btn-primary';
    read.href = post.url || '#';
    read.textContent = 'Les mer';

    var small = document.createElement('small');
    small.className = 'meta';
    small.textContent = (new Date(post.date)).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });

    footer.appendChild(read);
    footer.appendChild(small);
    body.appendChild(footer);

    article.appendChild(body);
    col.appendChild(article);
    return col;
  }

  function load(){
    var grid = document.getElementById('news-grid');
    if(!grid) return;
    fetch('/data/posts.json', {cache: 'no-store'})
      .then(function(res){ if(!res.ok) throw new Error('Network'); return res.json(); })
      .then(function(posts){
        if(!Array.isArray(posts) || posts.length === 0) return;
        posts.forEach(function(p){ grid.appendChild(renderCard(p)); });
      }).catch(function(err){
        console.error('Failed to load posts.json', err);
      });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
