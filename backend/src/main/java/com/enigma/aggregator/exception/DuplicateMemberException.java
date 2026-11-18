package com.enigma.aggregator.exception;

/**
 * Thrown when attempting to add a LeetCode username that already exists in the club roster.
 */
public class DuplicateMemberException extends RuntimeException {

    public DuplicateMemberException(String username) {
        super("LeetCode username '" + username + "' is already in the roster.");
    }
}
