var User = require('catfact-ecommerce').model
var cat_facts = require('cat-facts')
var twilio = require('twilio')
var lodash = require('lodash')
var faker = require('faker')
var plivo_base = require('plivo')

var plivo = plivo_base.RestAPI({
  authId: process.env.PLIVO_AUTH_ID,
  authToken: process.env.PLIVO_AUTH_TOKEN
});

var plivo_phone_number = process.env.PLIVO_PHONE_NUMBER


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
        // console.log("\tProcessing recipient:" + recipient.first_name + " " + recipient.last_name)

        if(is_time_to_send(recipient.interval)){

          var params = get_message_params(recipient.phone)
          console.log(params)
          // // Prints the complete response
          plivo.send_message(params, function (status, response) {
              console.log('Status: ', status);
              console.log('API Response:\n', response);
              console.log('Message UUID:\n', response['message_uuid']);
              console.log('Api ID:\n', response['api_id']);
          })


        }
        else {
          console.log("NO TEXT MESSAGE")
        }
}

var get_message_params = function(dest_phone){
  return {
    'src': plivo_phone_number, // Sender's phone number with country code
    'dst' : "+1" + dest_phone, // Receiver's phone Number with country code
    'text' : build_random_cat_fact(), // Your SMS Text Message - English
    'url' : "", // The URL to which with the status of the message is sent
    'method' : "GET" // The method used to call the url
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
    "Thanks for being a Cat Facts member!",
    "Did you know:",
    "Thanks for your interest in Cat Facts!",
    "ME-YOW!",
    "Are you kitten me?"
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
