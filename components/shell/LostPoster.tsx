"use client";
/* Generated from the original 404 page markup. */
import { PupBuddy } from "@/components/pup/runtime";

export default function LostPoster() {
  return (<>
<div className="gutter mx-auto grid min-h-[78vh] max-w-[110rem] place-items-center py-14">
  <div className="tp-poster">
    <span aria-hidden="true" className="tp-tape tp-tape--left"></span>
    <span aria-hidden="true" className="tp-tape tp-tape--right"></span>
    <p className="font-scrawl tp-poster__kicker">have you seen this page?</p>
    <h1 className="font-plush tp-poster__title">Lost
      <span className="sr-only">: this page has wandered off</span></h1>
    <div className="tp-poster__photo">
      <PupBuddy pose="sniff" facing="right" label="Teddy, sniffing out the missing page" /></div>
    <p className="tp-poster__desc">One page, last seen wandering off. It answers to the address you typed, but it isn't here any more. Teddy is on the case.</p>
    <p className="font-scrawl tp-poster__reward">if found, take a tab:</p>
    <ul className="tp-poster__tabs" aria-label="Pages that are here">
      <li>
        <a className="tp-poster__tab" href="/">Home</a></li>
      <li>
        <a className="tp-poster__tab" href="/puppies">Puppies</a></li>
      <li>
        <a className="tp-poster__tab" href="/how-it-works">How it works</a></li>
      <li>
        <a className="tp-poster__tab" href="/faq">Questions</a></li>
      <li>
        <a className="tp-poster__tab" href="/contact">Contact</a></li></ul></div></div>
  </>);
}
