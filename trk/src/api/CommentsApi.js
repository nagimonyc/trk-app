import React from 'react';
import { useState, useEffect } from "react";
import { firebase } from "@react-native-firebase/firestore";

function CommentsApi() {
    console.log('[DATABASE] CommentsAPI called');

    const ref = firebase.firestore().collection("comments");

    function addComment(comment) {
        return ref.add(comment);
    }

    function getComment(id) {
        return ref.doc(id).get();
    }

    function getCommentsBySomeField(field, value) {
        return ref.where(field, '==', value).get();
    }

    return {
        addComment,
        getComment,
        getCommentsBySomeField
    };
}

export default CommentsApi;
