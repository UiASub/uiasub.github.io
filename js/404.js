var $copyContainer = $(".copy-container"),
  $replayIcon = $("#cb-replay"),
  $copyWidth = $(".copy-container").find("p").width();

var mySplitText = new SplitText($copyContainer, { type: "words" }),
  splitTextTimeline = gsap.timeline();
var handleTL = gsap.timeline();

var tl = gsap.timeline();

tl.add(function () {
  animateCopy();
}, 0.2);

function animateCopy() {
  mySplitText.split({ type: "chars, words" });
  
  // Make handle visible first
  gsap.set(".handle", { autoAlpha: 1 });
  
  splitTextTimeline.from(
    mySplitText.chars,
    {
      autoAlpha: 0,
      duration: 0.001,
      ease: "back.inOut(1.7)",
      stagger: 0.05,
      onComplete: blinkHandle
    }
  );
  // Start handle animation at the same time, not after
  animateHandle();
}

function blinkHandle() {
  handleTL.fromTo(
    ".handle",
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.4, repeat: -1, yoyo: true }
  );
}

function animateHandle() {
  handleTL.to(".handle", {
    x: $copyWidth,
    duration: mySplitText.chars.length * 0.05,
    ease: "steps(" + mySplitText.chars.length + ")"
  }, 0);
}

$("#cb-replay").on("click", function () {
  splitTextTimeline.restart();
  handleTL.restart();
});
