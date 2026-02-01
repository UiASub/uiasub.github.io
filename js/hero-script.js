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

const showElements = () => {
  const timeline = gsap.timeline();
  timeline
        .fromTo(btnCircle, { autoAlpha: 0 }, { autoAlpha: 1, duration: fourtyFrames, ease: customEaseIn}, 0)
        .fromTo(btnCircle, { scale: 0.417 }, { scale: 1, duration: fourtyFrames, ease: customEaseIn}, 0)
        .to(eve, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, 0)
        .to(book, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, twoFrames)
        .to(fo, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames)
        .to(a, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames)
        .to(ory, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames)
        .to(open, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, fourFrames)
        .to(btnText, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, fourFrames)
        .to(ry, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames)
        .to(ssil, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames)
        .to(tells, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames)
        .to(st, { x: '0vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames)
        .to(copy, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, sixFrames)
        .to(scrollToRows, {y: '0vw', duration: fourtyFrames, ease: customEaseIn}, sixFrames);
  
  return timeline;
}

const hideElements = () => {
  const timeline = gsap.timeline();
  
  timeline
        .fromTo(copy, {y: '0vw'}, {y: '2.78vw', duration: fourtyFrames, ease: customEaseIn}, 0)
        .fromTo(scrollToRows, {y: '0vw'}, {y: '3.47vw', duration: fourtyFrames, ease: customEaseIn}, 0)
        .fromTo(open, {y: '0vw'}, {y: '2.08vw', duration: fourtyFrames, ease: customEaseIn}, twoFrames)
        .fromTo(btnText, {y: '0vw'}, {y: '2.78vw', duration: fourtyFrames, ease: customEaseIn}, twoFrames)
        .fromTo(ry, {x: '0vw'}, { x: '-13.89vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames)
        .fromTo(ssil, {x: '0vw'}, { x: '-21.53vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames)
        .fromTo(tells, {x: '0vw'}, { x: '29.86vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames)
        .fromTo(st, {x: '0vw'}, { x: '13.19vw', duration: fiftyFrames, ease: customEaseIn}, twoFrames)
        .fromTo(book, {y: '0vw'}, {y: '3.47vw', duration: fourtyFrames, ease: customEaseIn}, fourFrames)
        .fromTo(fo, {x: '0vw'}, { x: '14.58vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames)
        .fromTo(a, {x: '0vw'}, { x: '-8.33vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames)
        .fromTo(ory, {x: '0vw'}, { x: '-22.22vw', duration: fiftyFrames, ease: customEaseIn}, fourFrames)
        .fromTo(btnCircle, { autoAlpha: 1 }, { autoAlpha: 0, duration: fourtyFrames, ease: customEaseIn}, sixFrames)
        .fromTo(btnCircle, { scale: 1 }, { scale: 0.417, duration: fourtyFrames, ease: customEaseIn}, sixFrames)
        .fromTo(eve, {x: '0vw'}, { x: '18.75vw', duration: fiftyFrames, ease: customEaseIn}, sixFrames);
  
  return timeline;
}

document.addEventListener('DOMContentLoaded', () => {
  showElements();
});