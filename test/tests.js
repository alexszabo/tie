QUnit.test( "test template not found", function( assert ) {

  assert.throws(
      function() {
        var t = tie.createTemplate('#notfound');
      },
      "throws exception, if template is not found"
  );

});

QUnit.test( "test simple binding", function( assert ) {
  //creating template and binding
  var t = tie.createTemplate('#simple');
  t.bindHtml('span', 'name');

  //some data to show
  var data = {
    name: "Peter"
  };

  //run the template rendering
  var resultHtml = t.render(data);

  //check the result
  assert.equal(resultHtml, '<div id="simple">Hello, <span>Peter</span>!</div>');
});

QUnit.test( "test encoded binding", function( assert ) {
    //creating template and binding
    var t = tie.createTemplate('#simple');
    t.bindText('span', 'name');

    //some data to show
    var data = {
        name: "<i>Peter</i>"
    };

    //run the template rendering
    var resultHtml = t.render(data);

    //check the result
    assert.equal(resultHtml, '<div id="simple">Hello, <span>&lt;i&gt;Peter&lt;/i&gt;</span>!</div>');
});


QUnit.test( "test creating template removes elements", function( assert ) {
    //creating template and binding
    var t = tie.createTemplate('#simple');

    //check the result
    var element = document.querySelector('#simple');
    assert.ok(element === null , 'the template should be removed from the DOM');
});

QUnit.test( "test binding functions", function( assert ) {
  //creating template and binding
  var t = tie.createTemplate('#simple');
  t.bindHtml('span', function(data){ return data.name });

  //some data to show
  var data = {
    name: "Peter"
  };

  //run the template rendering
  var resultHtml = t.render(data);

  //check the result
  assert.equal(resultHtml, '<div id="simple">Hello, <span>Peter</span>!</div>');
});

QUnit.test( "test looping", function( assert ) {
  var t = tie.createTemplate('#loop');
  t.loop('li', 'animals')
      .bindHtml('');

  //some data to show
  var data = {
    animals : ["ape", "bear", "cat", "dog"]
  };

  //run the template rendering
  var resultHtml = t.render(data);

  //check the result
  assert.equal(resultHtml, '<ul id="loop">'+
      '<li>ape</li>'+
      '<li>bear</li>'+
      '<li>cat</li>'+
      '<li>dog</li>'+
      '</ul>');
});

QUnit.test( "test conditional sections", function( assert ) {
    var t = tie.createTemplate('#conditional');
    t.if('span', 'someFlag');

    //some data to show
    var data = {
        someFlag : true
    };

    assert.equal(t.render(data), '<div id="conditional">A<span>B</span>C</div>');

    data.someFlag = false;
    assert.equal(t.render(data), '<div id="conditional">AC</div>');
});

QUnit.test( "test attribute manipulation", function( assert ) {
    var t = tie.createTemplate('#attribute');
    t.bindAttr('img', 'alt', 'altText');

    //some data to show
    var data = {
        altText : 'alternative text here'
    };

    assert.equal(t.render(data), '<div id="attribute"><img alt="alternative text here"></div>');

    data.altText = 'test " escaping <>';
    assert.equal(t.render(data), '<div id="attribute"><img alt="test &quot; escaping &lt;&gt;"></div>');
});

QUnit.test( "test attribute manipulation", function( assert ) {
    var t = tie.createTemplate('#addClass');
    t.bindClass('.item', 'moreClasses');

    //some data to show
    var data = {
        moreClasses : 'foo bar'
    };

    assert.equal(t.render(data), '<div id="addClass"><span class="item foo bar"></span></div>');

    data.moreClasses = ['this', 'that'];
    assert.equal(t.render(data), '<div id="addClass"><span class="item this that"></span></div>');
});