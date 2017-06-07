/* Handle basic navigation using taps */

(function() {

  var page = 0;
  var hash = location.hash;
  if (hash=="#last") {
    document.body.scrollLeft = document.body.scrollWidth-window.innerWidth;
    page = (document.body.scrollWidth/window.innerWidth)-1;
  }
  
  window.addEventListener("click", (function(e) {        
    var clickX = e.pageX;
    console.log("Click detected at: "+clickX);
    //console.log((window.innerWidth*page)+(window.innerWidth/2));
    if (clickX > (window.innerWidth*page)+((window.innerWidth/3)*2)) {
      console.log("Current position: " + document.body.scrollLeft);
      if (document.body.scrollLeft+window.innerWidth == document.body.scrollWidth) {
        var next = document.querySelector("link[rel=next]");
        if (next.href && next.href!=location.href) location.href = next.href;
      } else {
        page = page+1;
      }
    } else if (clickX < (window.innerWidth*page)+(window.innerWidth/3)) {
      if (document.body.scrollLeft == 0) {
        var previous = document.querySelector("link[rel=prev]");
        if (previous.href) location.href = previous.href+"#last";
      } else {
        if (page>0) page = page-1;
      }
    }
    else {
      var navigation = parent.document.querySelector("nav")
      if (navigation) {
        if (navigation.style.display == "none") {
          navigation.style.display="";
        } else {
          navigation.style.display="none";
        }
      }
    }
    document.body.scrollLeft = page*(window.innerWidth);
  }));

  window.addEventListener("scroll", (function(e) {        
    document.body.scrollLeft = page*(window.innerWidth);
  }));

}());