using System;
using System.Collections.Generic;

namespace Agppa.Api.DataStructures
{
    /// <summary>
    /// Custom implementation of a Hash Table data structure.
    /// Uses separate chaining for collision resolution with a fixed number of buckets.
    /// Provides O(1) average time complexity for insert, delete, and lookup operations.
    /// </summary>
    public class CustomHashTable<TKey, TValue>
    {
        private const int DefaultCapacity = 16;
        private readonly LinkedList<KeyValuePair<TKey, TValue>>[] _buckets;
        private int _count;

        public CustomHashTable(int capacity = DefaultCapacity)
        {
            _buckets = new LinkedList<KeyValuePair<TKey, TValue>>[capacity];
            for (int i = 0; i < capacity; i++)
            {
                _buckets[i] = new LinkedList<KeyValuePair<TKey, TValue>>();
            }
        }

        /// <summary>
        /// Computes the hash code for a key and maps it to a bucket index.
        /// </summary>
        private int GetBucketIndex(TKey key)
        {
            return Math.Abs(key.GetHashCode()) % _buckets.Length;
        }

        /// <summary>
        /// Adds or updates a key-value pair in the hash table.
        /// </summary>
        public void Add(TKey key, TValue value)
        {
            int index = GetBucketIndex(key);
            var bucket = _buckets[index];

            // Check if key already exists, update if so
            foreach (var pair in bucket)
            {
                if (EqualityComparer<TKey>.Default.Equals(pair.Key, key))
                {
                    // Update existing value
                    bucket.Remove(pair);
                    bucket.AddLast(new KeyValuePair<TKey, TValue>(key, value));
                    return;
                }
            }

            // Add new key-value pair
            bucket.AddLast(new KeyValuePair<TKey, TValue>(key, value));
            _count++;
        }

        /// <summary>
        /// Retrieves the value associated with the specified key.
        /// Throws KeyNotFoundException if key is not found.
        /// </summary>
        public TValue Get(TKey key)
        {
            int index = GetBucketIndex(key);
            var bucket = _buckets[index];

            foreach (var pair in bucket)
            {
                if (EqualityComparer<TKey>.Default.Equals(pair.Key, key))
                {
                    return pair.Value;
                }
            }

            throw new KeyNotFoundException($"Key '{key}' not found in hash table.");
        }

        /// <summary>
        /// Removes the key-value pair with the specified key.
        /// Returns true if removed, false if key not found.
        /// </summary>
        public bool Remove(TKey key)
        {
            int index = GetBucketIndex(key);
            var bucket = _buckets[index];

            foreach (var pair in bucket)
            {
                if (EqualityComparer<TKey>.Default.Equals(pair.Key, key))
                {
                    bucket.Remove(pair);
                    _count--;
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Checks if the hash table contains the specified key.
        /// </summary>
        public bool ContainsKey(TKey key)
        {
            int index = GetBucketIndex(key);
            var bucket = _buckets[index];

            foreach (var pair in bucket)
            {
                if (EqualityComparer<TKey>.Default.Equals(pair.Key, key))
                {
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Gets the number of key-value pairs in the hash table.
        /// </summary>
        public int Count => _count;
    }

    /// <summary>
    /// Custom implementation of a Queue data structure.
    /// Follows First-In-First-Out (FIFO) principle.
    /// Uses a linked list for efficient enqueue and dequeue operations (O(1)).
    /// </summary>
    public class CustomQueue<T>
    {
        private readonly LinkedList<T> _list = new LinkedList<T>();

        /// <summary>
        /// Adds an item to the end of the queue.
        /// </summary>
        public void Enqueue(T item)
        {
            _list.AddLast(item);
        }

        /// <summary>
        /// Removes and returns the item at the front of the queue.
        /// Throws InvalidOperationException if queue is empty.
        /// </summary>
        public T Dequeue()
        {
            if (_list.Count == 0)
            {
                throw new InvalidOperationException("Queue is empty.");
            }

            T item = _list.First.Value;
            _list.RemoveFirst();
            return item;
        }

        /// <summary>
        /// Returns the item at the front of the queue without removing it.
        /// Throws InvalidOperationException if queue is empty.
        /// </summary>
        public T Peek()
        {
            if (_list.Count == 0)
            {
                throw new InvalidOperationException("Queue is empty.");
            }

            return _list.First.Value;
        }

        /// <summary>
        /// Checks if the queue is empty.
        /// </summary>
        public bool IsEmpty => _list.Count == 0;

        /// <summary>
        /// Gets the number of items in the queue.
        /// </summary>
        public int Count => _list.Count;
    }

    /// <summary>
    /// Custom implementation of a Stack data structure.
    /// Follows Last-In-First-Out (LIFO) principle.
    /// Uses a linked list for efficient push and pop operations (O(1)).
    /// </summary>
    public class CustomStack<T>
    {
        private readonly LinkedList<T> _list = new LinkedList<T>();

        /// <summary>
        /// Adds an item to the top of the stack.
        /// </summary>
        public void Push(T item)
        {
            _list.AddLast(item);
        }

        /// <summary>
        /// Removes and returns the item at the top of the stack.
        /// Throws InvalidOperationException if stack is empty.
        /// </summary>
        public T Pop()
        {
            if (_list.Count == 0)
            {
                throw new InvalidOperationException("Stack is empty.");
            }

            T item = _list.Last.Value;
            _list.RemoveLast();
            return item;
        }

        /// <summary>
        /// Returns the item at the top of the stack without removing it.
        /// Throws InvalidOperationException if stack is empty.
        /// </summary>
        public T Peek()
        {
            if (_list.Count == 0)
            {
                throw new InvalidOperationException("Stack is empty.");
            }

            return _list.Last.Value;
        }

        /// <summary>
        /// Checks if the stack is empty.
        /// </summary>
        public bool IsEmpty => _list.Count == 0;

        /// <summary>
        /// Gets the number of items in the stack.
        /// </summary>
        public int Count => _list.Count;
    }
}