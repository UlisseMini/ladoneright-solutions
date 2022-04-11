// Stupid fix because github pages is dumb and won't serve index.html to /axler
// (only to /axler/). Eventually I'll move away from github pages but for now
// a stupid hack will suffice
if (document.location.href.match(/ladoneright-solutions$|axler$/)) {
  document.location.href = "/axler/";
}
