"""
Test script for SuperMe API
Demonstrates OpenAI-compatible interface and direct HTTP requests
Note: The native superme-sdk package is not publicly available on PyPI
"""

import os
import json
from typing import Optional


def test_http_requests(api_key: str, base_url: str, username: str = "ludo"):
    """
    Test using direct HTTP requests (fallback method)
    
    Args:
        api_key: Your SuperMe API key
        base_url: Base URL for the SuperMe API
        username: Username for the request
    """
    try:
        import requests
        
        print("=" * 60)
        print("Testing SuperMe API (Direct HTTP Requests)")
        print("=" * 60)
        
        # Prepare request
        url = f"{base_url.rstrip('/')}/sdk/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        question = "What are the key principles of growth marketing?"
        payload = {
            "model": "gpt-4",
            "messages": [
                {"role": "user", "content": question}
            ],
            "username": username
        }
        
        print(f"\nQuestion: {question}")
        print(f"Username: {username}")
        print(f"Endpoint: {url}\n")
        
        # Make request
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        # Parse response
        result = response.json()
        answer = result.get("choices", [{}])[0].get("message", {}).get("content", "No answer received")
        
        print("Answer:")
        print("-" * 60)
        print(answer)
        print("-" * 60)
        print("\nResponse metadata:")
        print(f"  Status: {response.status_code}")
        if "usage" in result:
            print(f"  Tokens: {result['usage'].get('total_tokens', 'N/A')}")
        print("\n✓ HTTP requests test completed successfully!\n")
        
        return True
        
    except ImportError:
        print("❌ Error: requests package not installed")
        print("Install it with: pip install requests\n")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ HTTP Error: {type(e).__name__}: {e}\n")
        return False
    except Exception as e:
        print(f"❌ Error testing HTTP requests: {type(e).__name__}: {e}\n")
        return False


def test_openai_compatible(api_key: str, base_url: str, username: str = "ludo"):
    """
    Test the OpenAI-compatible interface
    
    Args:
        api_key: Your SuperMe API key
        base_url: Base URL for the SuperMe API (should end with /sdk)
        username: Username for the request
    """
    try:
        from openai import OpenAI
        
        print("=" * 60)
        print("Testing OpenAI-Compatible Interface")
        print("=" * 60)
        
        # Ensure base_url ends with /sdk for OpenAI interface
        if not base_url.endswith('/sdk'):
            base_url = f"{base_url.rstrip('/')}/sdk"
        
        # Initialize OpenAI client with SuperMe endpoint
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        # Test question
        question = "What are the key principles of growth marketing?"
        print(f"\nQuestion: {question}")
        print(f"Username: {username}\n")
        
        # Create chat completion
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "user", "content": question}
            ],
            extra_body={"username": username}
        )
        
        # Extract answer
        answer = response.choices[0].message.content
        
        print("Answer:")
        print("-" * 60)
        print(answer)
        print("-" * 60)
        print("\nResponse metadata:")
        print(f"  Model: {response.model}")
        print(f"  Finish reason: {response.choices[0].finish_reason}")
        if hasattr(response, 'usage'):
            print(f"  Tokens used: {response.usage.total_tokens}")
        print("\n✓ OpenAI-compatible interface test completed successfully!\n")
        
        return True
        
    except ImportError:
        print("❌ Error: openai package not installed")
        print("Install it with: pip install openai\n")
        return False
    except Exception as e:
        print(f"❌ Error testing OpenAI interface: {type(e).__name__}: {e}\n")
        return False


def main():
    """
    Main test runner
    """
    print("\n" + "=" * 60)
    print("SuperMe API Test Suite")
    print("=" * 60 + "\n")
    
    # Configuration - you can set these via environment variables or modify directly
    api_key = os.getenv("SUPERME_API_KEY", "your-api-key")
    base_url = os.getenv("SUPERME_BASE_URL", "https://api.superme.ai")
    username = os.getenv("SUPERME_USERNAME", "ludo")
    
    # Validate configuration
    if api_key == "your-api-key":
        print("⚠️  WARNING: Using placeholder API key. Please set a valid API key.")
        print("   Set the SUPERME_API_KEY environment variable or modify the script.\n")
        print("   To get a SuperMe API key, visit: https://superme.ai (or your provider's website)\n")
    
    print(f"Configuration:")
    print(f"  Base URL: {base_url}")
    print(f"  Username: {username}")
    print(f"  API Key: {'*' * (len(api_key) - 4) + api_key[-4:] if len(api_key) > 4 else '***'}\n")
    
    # Run tests
    results = []
    
    # Test 1: Direct HTTP requests (most reliable)
    results.append(("HTTP Requests", test_http_requests(api_key, base_url, username)))
    
    # Test 2: OpenAI-compatible interface
    results.append(("OpenAI-compatible", test_openai_compatible(api_key, base_url, username)))
    
    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    for name, result in results:
        status = '✓ PASSED' if result else '❌ FAILED'
        print(f"{name:25} {status}")
    
    passed = sum(1 for _, result in results if result)
    print(f"\nTotal: {passed}/{len(results)} tests passed")
    print("=" * 60 + "\n")
    
    if passed == 0:
        print("ℹ️  All tests failed. Please check:")
        print("   1. Your API key is valid")
        print("   2. The base URL is correct")
        print("   3. Required packages are installed: pip install openai requests")
        print("   4. You have internet connectivity\n")



if __name__ == "__main__":
    main()
