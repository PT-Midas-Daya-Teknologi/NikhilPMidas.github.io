<?php

// Define some constants
define( "ADMIN_RECIPIENT_NAME", "Midas Admin" );
define( "ADMIN_RECIPIENT_EMAIL", "admin@midasteknologi.com" );

define( "HR_RECIPIENT_NAME", "Midas HR" );
define( "HR_RECIPIENT_EMAIL", "humanresources@midasteknologi.com" );

// Read the form values
$success = false;
$userName = isset( $_POST['username'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['username'] ) : "";
$senderEmail = isset( $_POST['email'] ) ? preg_replace( "/[^\.\-\_\@a-zA-Z0-9]/", "", $_POST['email'] ) : "";
$userPhone = isset( $_POST['phone'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['phone'] ) : "";
$userSubject = isset( $_POST['subject'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['subject'] ) : "Contact Inquiry";
$message = isset( $_POST['message'] ) ? preg_replace( "/(From:|To:|BCC:|CC:|Subject:|Content-Type:)/", "", $_POST['message'] ) : "";

// Determine recipient based on subject
$isJobApplication = (stripos($userSubject, 'Job Application') !== false || stripos($userSubject, 'Application') !== false);

if ($isJobApplication) {
    $recipientEmail = HR_RECIPIENT_EMAIL;
    $recipientName = HR_RECIPIENT_NAME;
} else {
    $recipientEmail = ADMIN_RECIPIENT_EMAIL;
    $recipientName = ADMIN_RECIPIENT_NAME;
}

// If all values exist, send the email
if ( $userName && $senderEmail && $userPhone && $userSubject ) {
    $recipient = $recipientName . " <" . $recipientEmail . ">";
    
    // Boundary for multipart email
    $boundary = md5(time());
    
    // Headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "From: " . $userName . " <" . $senderEmail . ">\r\n";
    $headers .= "Reply-To: " . $senderEmail . "\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"" . $boundary . "\"\r\n";
    
    // Message Body
    $msgBody = "--" . $boundary . "\r\n";
    $msgBody .= "Content-Type: text/plain; charset=\"UTF-8\"\r\n";
    $msgBody .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    
    $msgBody .= "Name: " . $userName . "\r\n";
    $msgBody .= "Email: " . $senderEmail . "\r\n";
    $msgBody .= "Phone: " . $userPhone . "\r\n";
    $msgBody .= "Subject: " . $userSubject . "\r\n\r\n";
    $msgBody .= "Message:\r\n" . $message . "\r\n\r\n";
    
    // Handle Attachment (CV)
    if (isset($_FILES['cv']) && $_FILES['cv']['error'] == UPLOAD_ERR_OK) {
        $file_name = $_FILES['cv']['name'];
        $file_size = $_FILES['cv']['size'];
        $file_tmp = $_FILES['cv']['tmp_name'];
        $file_type = $_FILES['cv']['type'];
        
        $handle = fopen($file_tmp, "r");
        $content = fread($handle, $file_size);
        fclose($handle);
        $encoded_content = chunk_split(base64_encode($content));
        
        $msgBody .= "--" . $boundary . "\r\n";
        $msgBody .= "Content-Type: " . $file_type . "; name=\"" . $file_name . "\"\r\n";
        $msgBody .= "Content-Disposition: attachment; filename=\"" . $file_name . "\"\r\n";
        $msgBody .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $msgBody .= $encoded_content . "\r\n\r\n";
    }
    
    $msgBody .= "--" . $boundary . "--";

    $success = mail( $recipient, $userSubject, $msgBody, $headers );

    // Determine redirect based on origin
    $redirect = 'contact/contact.html';
    if ($isJobApplication) {
        $redirect = 'career/all-jop-post.html';
    }

    if ($success) {
        header('Location: /' . $redirect . '?message=Successfull');
    } else {
        header('Location: /' . $redirect . '?message=Failed');
    }
    exit;
} else {
    header('Location: /index.html?message=Failed');
    exit;
}

?>