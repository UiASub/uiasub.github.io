gsap.registerPlugin(CustomEase);

const customEaseIn = CustomEase.create('custom-ease-in', '0.52, 0.00, 0.48, 1.00');
const fourtyFrames = 1.3333333;
const fiftyFrames = 1.66666;
const twoFrames = 0.666666;
const fourFrames = 0.133333;
const sixFrames = 0.2;

const video = document.querySelector('.hero-video');
const book = document.querySelector('.first-desc span');
const open = document.querySelector('.second-desc span');
const copy = document.querySelector('.copyright span');
const scrollToRows = document.querySelectorAll('.scroll-to .scroll-to__row span');
const btnCircle = document.querySelector('.book-btn__circle');
const btnText = document.querySelector('.btn-text span');
const eve = document.querySelector('#eve span');
const ry = document.querySelector('#ry span');
const fo = document.querySelector('#fo span');
const ssil = document.querySelector('#ssil span');
const tells = document.querySelector('#tells span');
const a = document.querySelector('#a span');
const st = document.querySelector('#st span');
const ory = document.querySelector('#ory span');

const hasNode = (node) => !!node;
const hasNodes = (nodes) => nodes && nodes.length > 0;

const showElements = () => {
  const timeline = gsap.timeline();

  if (hasNode(btnCircle)) {
    timeline.fromTo(btnCircle, { autoAlpha: 0 }, { autoAlpha: 1, duration: fourtyFrames, ease: customEaseIn}, 0);
    timeline.fromTo(btnCircle, { scale: 0.417 }, { scale: 1, duration: fourtyFrames, ease: customEaseIn}, 0);
  }
  if (hasNode(eve)) timeline.to(eve, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, 0);
  if (hasNode(book)) timeline.to(book, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(fo)) timeline.to(fo, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(a)) timeline.to(a, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(ory)) timeline.to(ory, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(open)) timeline.to(open, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(btnText)) timeline.to(btnText, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(ry)) timeline.to(ry, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(ssil)) timeline.to(ssil, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(tells)) timeline.to(tells, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(st)) timeline.to(st, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(copy)) timeline.to(copy, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, sixFrames);
  if (hasNodes(scrollToRows)) timeline.to(scrollToRows, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, sixFrames);

  return timeline;
}

const hideElements = () => {
  const timeline = gsap.timeline();

  if (hasNode(copy)) timeline.fromTo(copy, {y: '0vw'}, {y: '2.78vw', duration: fourtyFrames, ease: customEaseIn}, 0);
  if (hasNodes(scrollToRows)) timeline.fromTo(scrollToRows, {y: '0vw'}, {y: '3.47vw', duration: fourtyFrames, ease: customEaseIn}, 0);
  if (hasNode(open)) timeline.fromTo(open, {y: '0vw'}, {y: '2.08vw', duration: fourtyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(btnText)) timeline.fromTo(btnText, {y: '0vw'}, {y: '2.78vw', duration: fourtyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(ry)) timeline.fromTo(ry, {x: '0vw'}, { x: '-13.89vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(ssil)) timeline.fromTo(ssil, {x: '0vw'}, { x: '-21.53vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(tells)) timeline.fromTo(tells, {x: '0vw'}, { x: '29.86vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(st)) timeline.fromTo(st, {x: '0vw'}, { x: '13.19vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames);
  if (hasNode(book)) timeline.fromTo(book, {y: '0vw'}, {y: '3.47vw', duration: fourtyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(fo)) timeline.fromTo(fo, {x: '0vw'}, { x: '14.58vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(a)) timeline.fromTo(a, {x: '0vw'}, { x: '-8.33vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(ory)) timeline.fromTo(ory, {x: '0vw'}, { x: '-22.22vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames);
  if (hasNode(btnCircle)) {
    timeline.fromTo(btnCircle, { autoAlpha: 1 }, { autoAlpha: 0, duration: fourtyFrames, ease: customEaseIn}, sixFrames);
    timeline.fromTo(btnCircle, { scale: 1 }, { scale: 0.417, duration: fourtyFrames, ease: customEaseIn}, sixFrames);
  }
  if (hasNode(eve)) timeline.fromTo(eve, {x: '0vw'}, { x: '18.75vw', duration: fiftyFrames, ease: customEaseIn}, sixFrames);

  return timeline;
}

document.addEventListener('DOMContentLoaded', () => {
  showElements();
});
