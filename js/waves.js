window.addEventListener('DOMContentLoaded', function() {
  const wavesContainer = document.querySelector('.wavesContainer');
  if (wavesContainer) {
    wavesContainer.classList.add('flipped'); // Ensure the flipped class is applied
    console.log('Wave animation initialized and flipped');
  }
});
