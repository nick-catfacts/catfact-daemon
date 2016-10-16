var User = require('catfact-ecommerce').model
var cat_facts = require('cat-facts')
var twilio = require('twilio')
var lodash = require('lodash')
var faker = require('faker')




// Get all users
User.find({}, function(err, users) {
    users.forEach(function(user) {
      console.log("Catfact Daemon: Processing User:" + user.username)
      if(!user.cat_fact_active){return;}
      user.recipients.forEach(function(recipient){
        process_recipient(recipient)
      })
    });
  });

// process each recipient
var process_recipient= function(recipient){
        console.log("\tCatfact Daemon: Processing recipient:" + recipient.first_name + " " + recipient.last_name)

        if(is_time_to_send(recipient.interval)){
          console.log(recipient.phone)
          console.log(build_random_cat_fact())
          console.log(reply())
        }
        else {
          console.log("NO TEXT MESSAGE")
        }
}


var is_time_to_send = function(interval){
  var date = new Date()
  var minutes = date.getMinutes()
  var result = minutes % interval
  console.log("\t The minutes are: " + minutes)
  console.log("\t The interval is: " + interval)
  console.log("\t The modulus (minutes % interval) is: " + result)

  if(result === 0 ){
    return true;
  }else{
    return false;
  }
}

var build_random_cat_fact = function(){
  return intro_message() + " " + cat_facts.random() + ". " + cancellation_message();
}



var intro_message = function(){
  return "Thank you for subscribing to Catfacts! You are now on the list to occasionally receive a fun catfact! Meow! >^<"
}


var build_random_cat_fact = function(){
  return intro_message() + " " + cat_facts.random() + ". " + cancellation_message();
}


var cancellation_message = function(){
  return "<reply '" + generate_cancellation_code() + "' to cancel>"
}

var reply = function(){
  return "Command not recognized. You have a <year> subscription to Cat Facts and will continue to receive fun feline updates!"
}

var intro_message =function(){
  var intro_array = [
    "Thanks for being a Cat Facts subscriber!",
    "Did you know:",
    "Thanks for your interest in Cat Facts!",
    "ME-YOW!"
  ]
  return intro_array[faker.random.number(3)]
}

var generate_cancellation_code = function(){
 var first_part =generate_random_hash("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 4);
 var second_part = generate_random_hash("0123456789", 5);
 var third_part =generate_random_hash("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 5);
 return first_part + second_part + third_part;
}


function generate_random_hash(character_options, length)
{
    var text = "";
    var possible = character_options;

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

// for each user
// is catfact active?

    // get all recipients
    // for each recipient
        //modulus interval with the time
        //if yes
            //get recipient phone
            //get random cat fact
            //twilio-> phone + catfact
