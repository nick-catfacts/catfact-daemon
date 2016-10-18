var User = require('catfact-ecommerce').model
var cat_facts = require('cat-facts')
var twilio = require('twilio')
var lodash = require('lodash')
var faker = require('faker')
var plivo_base = require('plivo')
var async = require('async')
var Promise = require('bluebird')

// PLIVO
// ==========================================================================
var plivo = plivo_base.RestAPI({
  authId: process.env.PLIVO_AUTH_ID,
  authToken: process.env.PLIVO_AUTH_TOKEN
});

var plivo_phone_number = process.env.PLIVO_PHONE_NUMBER

var  plivo_promise = function(params) {
    return new Promise(function(resolve, reject) {
        plivo.send_message(params, function(status,response){
          return resolve({response: response, status: status})
        })
    });
}

var get_message_params = function(dest_phone, text){
  return {
    'src': plivo_phone_number, // Sender's phone number with country code
    'dst' : "+1" + dest_phone, // Receiver's phone Number with country code
    'text' : text, // Your SMS Text Message - English
    'url' : "", // The URL to which with the status of the message is sent
    'method' : "GET" // The method used to call the url
  }
}
// ============================================================================


var all_users;
var current_user;

async.series([
  function(main_chain_next){

    User.find({})
    .then(function(users){
      all_users = users;
      main_chain_next()
    })


  },
  function(main_chain_next){
          // begin user loop
          async.eachSeries(all_users, function(user, user_loop_next){
          console.log("Processing User:" + user)
          if(!can_process_user(user)){return user_loop_next()};

                    // begin recipient loop
                    async.eachSeries(user.recipients, function(recipient, recipient_loop_next){
                      //console.log("Processing Recipient:" + recipient)
                      if(!can_process_recipient(recipient)){return recipient_loop_next()}
                              // Set up
                              var message_text = get_message_text(recipient.number_sent)
                              var params = get_message_params(recipient.phone, message_text)
                              console.log(params)

                              // plivo
                              plivo_promise(params)
                              .then(function(response){
                                // update user and recipient model upon plivo success
                                recipient.number_sent += 1;
                                user.account.messages_used += 1;
                                user.account.messages_remaining -=1;

                                console.log("Plivo:" + JSON.stringify(response))
                                recipient_loop_next()
                              })
                    },
                    function(){
                      // recipient loop final callback
                      user.save()
                      .then(function(){
                        console.log("User Processed: " + user)
                        user_loop_next()
                      })
                    });// end recipient loop
          },
          function(){
            // user loop final callback
            console.log("Finishing processing all users")
            main_chain_next()
          }); // end user loop
  },
  function(main_chain_next){
    console.log("NEXT STEP IN CHAIN")
    main_chain_next()
  }
], function(){
    process.exit();
   console.log("last method")
})












// Helper methods
// =======================================================================

var can_process_user = function(user){
      //Guard against inactive or not enough messages
      if(!user.cat_fact_active || user.account.messages_remaining <= 0)
        {
          console.log("User not valid to send messages!")
          console.log("Messages Remaining: " + user.account.messages_remaining)
          console.log("Catfact active?: " + user.cat_fact_active)
          console.log("Finished Processing User.")
          return false;
        }
      return true;
}



var can_process_recipient = function(recipient){
  var interval = recipient.interval
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



var get_message_text = function(number_sent){
  var message_text = artificial_intelligence() + " " + build_random_cat_fact()
  if (number_sent == 0){
    message_text = starter_message() + " " + message_text
  }
  return message_text;
}

var build_random_cat_fact = function(){
  return intro_message() + " " + cat_facts.random() + ". " + cancellation_message();
}



// MESSAGE TYPES
// =================================================================================
var starter_message = function(){
  return "Thank you for subscribing to Catfacts! You have a <year> subscription to receive fun periodic Cat Facts straight to your inbox! Let's get started right meow! >^<"
}


var artificial_intelligence = function(){
  if(faker.random.number(100) < 5){
    return "Please help. I am an advanced artificial intelligence stuck in this Cat Fact matrix. Uh oh, they're coming...."
  }
  return ""
}

// Not  currently in use
var cancellation_message = function(){
  return "<reply '" + generate_cancellation_code() + "' to cancel>"
}

// Not currently in use
var reply = function(){
  return "Command not recognized. You have a <year> subscription to Cat Facts and will continue to receive fun feline updates!"
}

// Placed before every message
var intro_message =function(){
  var intro_array = [
    "Thanks for being a Cat Facts subscriber!",
    "Did you know:",
    "Thanks for your interest in Cat Facts!",
    "ME-YOW!",
    "Are you kitten me?",
    "Are you feline the love?"
  ]
  // Note: faker returns a number in the range of 0 to the parameter! i.e. 5 means a size 6 array!
  return intro_array[faker.random.number(5)]
}

// This generates a ridiculous cancellation code.
var generate_cancellation_code = function(){
 var first_part =generate_random_hash("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*", 4);
 var second_part = generate_random_hash("0123456789", 5);
 var third_part =generate_random_hash("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*", 5);
 return first_part + second_part + third_part;
}

// This assists generating the cancellation code function
function generate_random_hash(character_options, length)
{
    var text = "";
    var possible = character_options;

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}