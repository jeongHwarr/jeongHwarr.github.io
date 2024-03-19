export function toc() {
  if (document.querySelector('main h1, main h2, main h3')) {
    // see: https://github.com/tscanlin/tocbot#usage
    tocbot.init({
      tocSelector: '#toc',
      contentSelector: '.content',
      ignoreSelector: '[data-toc-skip]',
      headingSelector: 'h1, h2, h3, h4',
      orderedList: false,
      scrollSmooth: false,
      collapseDepth: 6, //unfold all list
    });
  }
}
