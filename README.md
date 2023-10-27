# trk-app

**If npm start fails due to dependency issues, run:**
  yarn install
  cd ios
  pod update Firebase/Firestore 
  cd ..
  npm start

  **Good to know**
  The TextInput component's placeholder text font color is not legible on all iPhones. You must set the placeholderTextColor everytime you use TextInput like so:

             <TextInput
              placeholderTextColor= {"#b1b1b3"}
            />