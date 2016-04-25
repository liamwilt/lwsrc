      $( document ).ready(function() {
        $('[role=navigation] a').hover(function(){
        $(this).closest('header').css('background-color', $(this).css('background-color'));
        },function(){
        $(this).closest('header').css('background-color', '#e8e8e8');
        });
      });
