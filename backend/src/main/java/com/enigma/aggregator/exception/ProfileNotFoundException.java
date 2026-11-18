package com.enigma.aggregator.exception;

/**
 * Thrown when a requested LeetCode username does not exist on LeetCode.
 */
public class ProfileNotFoundException extends RuntimeException {

    public ProfileNotFoundException(String username) {
        super("LeetCode profile '" + username + "' was not found. Please check the username and try again.");
    }
}
