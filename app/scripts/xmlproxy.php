<?php
    $url = $_REQUEST['url'];
    $values = '<str name="val" val=""/>';
    if ($_REQUEST['values']) {
        $values = $_REQUEST['values'];
    }
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_BINARYTRANSFER, 1); // --data-binary
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml','Accept-Encoding: gzip, deflate')); // -H
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $values);  
    curl_setopt( $ch, CURLOPT_ENCODING, '' ); 
    $resp = curl_exec($ch);
    $xml = simplexml_load_string($resp);
    echo $xml;
    curl_close($ch);
?>